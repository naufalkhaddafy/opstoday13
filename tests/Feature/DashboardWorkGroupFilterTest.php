<?php

use App\Exports\DashboardExport;
use App\Models\Company;
use App\Models\Group;
use App\Models\Ticket;
use App\Models\User;
use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Attendance\AttendanceAnalyticsService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Maatwebsite\Excel\Facades\Excel;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
    $this->company = Company::create(['name' => 'Filter Test', 'slug' => 'filter-test']);
    $this->members = [];
    foreach (['DCO', 'DSO', 'OTHER'] as $index => $name) {
        $group = Group::create(['name' => $name, 'slug' => strtolower($name)]);
        $user = User::factory()->forCompany($this->company)->create(['group_id' => $group->id]);
        $this->members[$name] = $user;
        Ticket::create([
            'ticket_no' => (string) (1000 + $index), 'status' => 'closed', 'title' => 'Network test',
            'assigned_to_user_id' => $user->id, 'api_creation_date' => '2026-10-31',
        ]);
        DB::table('attendance_days')->insert([
            'user_id' => $user->id, 'company_id' => $this->company->id,
            'work_date' => '2026-10-31', 'presence_status' => 'hadir', 'late_minutes' => ($index + 1) * 10,
        ]);
    }
    $this->actingAs($this->members['DCO']);
    $this->date = CarbonImmutable::parse('2026-10-31');
});

it('normalizes legacy and multiple work group URLs', function () {
    $this->get('/?work_group=DCO')->assertInertia(fn (Assert $page) => $page->where('filters.work_group', ['DCO']));
    $this->get('/?'.http_build_query(['work_group' => ['DCO', 'DSO']]))->assertInertia(fn (Assert $page) => $page->where('filters.work_group', ['DCO', 'DSO']));
    $this->get('/?work_group=all')->assertInertia(fn (Assert $page) => $page->where('filters.work_group', []));
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('filters.work_group', []));
});

it('rejects malformed work group arrays', function () {
    $this->getJson('/?'.http_build_query(['work_group' => [['invalid']]]))->assertUnprocessable()->assertJsonValidationErrors('work_group.0');
});

it('restricts ticket queries to any of the selected groups and retains other filters', function () {
    $repo = app(TicketDashboardRepositoryInterface::class);
    $result = $repo->paginateLatest($this->date, $this->date, $this->company->id, 10, 'Network', null, 'desc', 'closed', ['DCO', 'DSO']);
    expect(collect($result->items())->pluck('ticket_no')->sort()->values()->all())->toBe(['1000', '1001']);
    expect($repo->paginateLatest($this->date, $this->date, null, 10, null, null, 'desc', null, 'DCO')->total())->toBe(1);
    expect($repo->paginateLatest($this->date, $this->date, null, 10, null, null, 'desc', null, [])->total())->toBe(3);
    expect($repo->paginateLatest($this->date, $this->date, null, 10, null, null, 'desc', 'assigned', ['DCO', 'DSO'])->total())->toBe(0);
});

it('filters attendance and analytics by the same groups', function () {
    $users = app(UserRepositoryInterface::class)->activeForDashboard('2026-10-31', '2026-10-31', null, ['DCO', 'DSO']);
    expect($users->modelKeys())->toEqualCanonicalizing([$this->members['DCO']->id, $this->members['DSO']->id]);
    $analytics = app(AttendanceAnalyticsService::class);
    expect($analytics->getLateTrend($this->date, $this->date, null, ['DCO', 'DSO']))->toBe(['2026-10-31' => 30]);
    expect($analytics->getDisciplineLeaderboard($this->date, $this->date, null, ['DCO', 'DSO'])->pluck('user_id')->all())
        ->toEqualCanonicalizing([$this->members['DCO']->id, $this->members['DSO']->id]);
});

it('forwards groups search status and company to all export sheet queries', function () {
    Excel::fake();
    $groups = ['DCO', 'DSO'];
    $companyId = $this->company->id;
    $repo = Mockery::mock(TicketDashboardRepositoryInterface::class);
    $repo->shouldReceive('paginateLatest')->once()->withArgs(fn ($from, $to, $company, $size, $search, $sort, $direction, $status, $workGroups) => $company === $companyId && $size === 100000 && $search === 'Network' && $sort === 'created_date' && $direction === 'asc' && $status === 'closed' && $workGroups === $groups)
        ->andReturn(new LengthAwarePaginator([], 0, 100000));
    $repo->shouldReceive('globalStats')->twice()->withArgs(fn ($from, $to, $company, $workGroups, $search, $status) => $company === $companyId && $workGroups === $groups && $search === 'Network' && $status === 'closed')->andReturn([]);
    $repo->shouldReceive('engineerSummaries')->once()->withArgs(fn ($from, $to, $company, $workGroups, $search, $status) => $company === $companyId && $workGroups === $groups && $search === 'Network' && $status === 'closed')->andReturn(collect());
    $repo->shouldReceive('getTrendingKeywords')->once()->withArgs(fn ($from, $to, $company, $limit, $workGroups, $search, $status) => $company === $companyId && $workGroups === $groups && $search === 'Network' && $status === 'closed')->andReturn([]);
    $repo->shouldReceive('getTicketsByWorkGroup')->once()->withArgs(fn ($from, $to, $company, $workGroups, $search, $status) => $company === $companyId && $workGroups === $groups && $search === 'Network' && $status === 'closed')->andReturn([]);
    app()->instance(TicketDashboardRepositoryInterface::class, $repo);
    $users = Mockery::mock(UserRepositoryInterface::class);
    $users->shouldReceive('activeForDashboard')->once()->with('2026-10-31', '2026-10-31', $companyId, $groups)->andReturn(new Collection);
    app()->instance(UserRepositoryInterface::class, $users);

    $this->get('/export?'.http_build_query([
        'date_from' => '2026-10-31', 'date_to' => '2026-10-31', 'company_id' => $companyId,
        'work_group' => $groups, 'search' => 'Network', 'status' => 'closed', 'sort_by' => 'created_date', 'sort_dir' => 'asc',
    ]))->assertOk();
    Excel::assertDownloaded('dashboard-export-2026-10-31-to-2026-10-31.xlsx', function (DashboardExport $export) {
        $sheets = $export->sheets();
        expect($sheets)->toHaveCount(3);
        foreach ($sheets as $sheet) {
            expect($sheet->view()->render())->toContain('Work Groups: DCO, DSO');
        }

        return true;
    });
});
