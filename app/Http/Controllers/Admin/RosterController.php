<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\RosterPageResource;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\Group;
use App\Models\Shift;
use Inertia\Inertia;
use Inertia\Response;

class RosterController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly CompanyRepositoryInterface $companies,
        private readonly ShiftAssignmentResolver $shiftResolver
    ) {}

    public function index(Request $request): Response
    {
        $timezone = config('app.timezone');
        $now = CarbonImmutable::now($timezone);

        $month = (int) $request->input('month', $now->month);
        $year = (int) $request->input('year', $now->year);

        // Clamp values
        $month = max(1, min(12, $month));
        $year = max(2020, min(2099, $year));

        $startOfMonth = CarbonImmutable::create($year, $month, 1, 0, 0, 0, $timezone);

        // Gather filters
        $filters = [
            'search' => $request->input('search'),
            'company_id' => $request->input('company_id', 'all'),
            'group_id' => $request->input('group_id', 'all'),
        ];

        // Fetch data through repositories (following rules.md)
        $employees = $this->users->getEmployeesForRoster($filters);
        $companiesList = $this->companies->all();
        
        try {
            $rows = Cache::store('redis')->get('groups.all_select');
            if (! is_array($rows)) {
                $rows = Group::select('id', 'name')->get()->toArray();
                Cache::store('redis')->forever('groups.all_select', $rows);
            }
            $groupsList = Group::query()->hydrate($rows);
        } catch (\Exception $e) {
            $groupsList = Group::select('id', 'name')->get();
        }
        
        try {
            $rows = Cache::store('redis')->get('shifts.all');
            if (! is_array($rows)) {
                $rows = Shift::select('id', 'name', 'code')->get()->toArray();
                Cache::store('redis')->forever('shifts.all', $rows);
            }
            $shiftsList = Shift::query()->hydrate($rows);
        } catch (\Exception $e) {
            $shiftsList = Shift::select('id', 'name', 'code')->get();
        }

        // Return Inertia rendering with Page Resource shaping (following rules.md)
        return Inertia::render(
            'admin/roster/index',
            RosterPageResource::make([
                'users' => $employees,
                'companies' => $companiesList,
                'groups' => $groupsList,
                'shifts' => $shiftsList,
                'start_of_month' => $startOfMonth,
                'month' => $month,
                'year' => $year,
                'filters' => $filters,
                'shift_resolver' => $this->shiftResolver,
            ])->resolve()
        );
    }
}
