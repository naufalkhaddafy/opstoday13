<?php

use App\Contracts\Fingerprint\FingerprintClientInterface;
use App\Enums\AttendanceLogStatus;
use App\Enums\AttendancePresenceStatus;
use App\Enums\AttendanceTimingStatus;
use App\Models\AttendanceDay;
use App\Models\AttendanceLog;
use App\Models\AttendanceSyncRun;
use App\Models\User;
use App\Models\UserShiftAssignment;
use App\Repositories\Contracts\AttendanceLogRepositoryInterface;
use App\Services\Attendance\AttendanceDayAggregator;
use App\Services\Attendance\AttendanceWorkDateResolver;
use App\Services\Fingerprint\ArrayFingerprintClient;
use Carbon\CarbonImmutable;
use Database\Seeders\CompanySeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ShiftSeeder;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('duplicate attendance log insert is ignored', function () {
    $company = CompanySeeder::$companies[0];
    $user = User::factory()->forCompany($company)->create([
        'employee_id' => '10001',
    ]);

    $repo = app(AttendanceLogRepositoryInterface::class);
    $run = AttendanceSyncRun::query()->create([
        'started_at' => now(),
        'window_from' => now()->subDay(),
        'window_to' => now(),
        'status' => 'running',
    ]);

    $punchedAt = CarbonImmutable::parse('2026-05-26 15:05:00', 'Asia/Makassar');
    $workDate = $punchedAt->startOfDay();

    $record = [
        'employee_id' => '10001',
        'status' => AttendanceLogStatus::Hadir->value,
        'punched_at' => $punchedAt,
    ];

    expect($repo->insertFromSyncRecord($record, $user, $workDate, $run))->toBeTrue()
        ->and($repo->insertFromSyncRecord($record, $user, $workDate, $run))->toBeFalse()
        ->and(AttendanceLog::query()->count())->toBe(1);
});

test('malam shift work_date uses next day for evening check-in', function () {
    $company = CompanySeeder::$companies[0];
    $shift = ShiftSeeder::forCompany($company, 'malam');

    $user = User::factory()->forCompany($company)->create([
        'employee_id' => '10002',
    ]);

    UserShiftAssignment::factory()->create([
        'user_id' => $user->id,
        'shift_id' => $shift->id,
        'effective_from' => '2026-01-01',
        'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
    ]);

    $resolver = app(AttendanceWorkDateResolver::class);

    $checkIn = CarbonImmutable::parse('2026-05-26 23:10:00', 'Asia/Makassar');
    $resolved = $resolver->resolve($user, $checkIn);

    expect($resolved)->not->toBeNull()
        ->and($resolved['work_date']->toDateString())->toBe('2026-05-27')
        ->and($resolved['shift']->code)->toBe('malam');

    $checkOut = CarbonImmutable::parse('2026-05-27 07:55:00', 'Asia/Makassar');
    $resolvedOut = $resolver->resolve($user, $checkOut);

    expect($resolvedOut['work_date']->toDateString())->toBe('2026-05-27');
});

test('aggregator marks hadir when check-in and check-out exist for malam shift', function () {
    $company = CompanySeeder::$companies[0];
    $shift = ShiftSeeder::forCompany($company, 'malam');

    $user = User::factory()->forCompany($company)->create([
        'employee_id' => '10003',
    ]);

    UserShiftAssignment::factory()->create([
        'user_id' => $user->id,
        'shift_id' => $shift->id,
        'effective_from' => '2026-01-01',
        'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
    ]);

    $workDate = CarbonImmutable::parse('2026-05-27', 'Asia/Makassar');

    AttendanceLog::query()->create([
        'employee_id' => '10003',
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => AttendanceLogStatus::Hadir,
        'punched_at' => CarbonImmutable::parse('2026-05-26 23:05:00', 'Asia/Makassar'),
        'work_date' => '2026-05-27',
        'created_at' => now(),
    ]);

    AttendanceLog::query()->create([
        'employee_id' => '10003',
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => AttendanceLogStatus::Keluar,
        'punched_at' => CarbonImmutable::parse('2026-05-27 07:50:00', 'Asia/Makassar'),
        'work_date' => '2026-05-27',
        'created_at' => now(),
    ]);

    $day = app(AttendanceDayAggregator::class)->rebuildForUserAndDate(
        $user,
        $workDate,
        allowAbsentMarking: true,
    );

    expect($day->presence_status)->toBe(AttendancePresenceStatus::Hadir)
        ->and($day->timing_status)->toBe(AttendanceTimingStatus::OnTime)
        ->and($day->shift_id)->toBe($shift->id);
});

test('sync command imports records and rebuilds attendance days', function () {
    $company = CompanySeeder::$companies[0];
    $shift = ShiftSeeder::forCompany($company, 'sore');

    $user = User::factory()->forCompany($company)->create([
        'employee_id' => '10004',
    ]);

    UserShiftAssignment::factory()->create([
        'user_id' => $user->id,
        'shift_id' => $shift->id,
        'effective_from' => '2026-01-01',
        'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
    ]);

    $this->app->instance(FingerprintClientInterface::class, new ArrayFingerprintClient([
        [
            'employee_id' => '10004',
            'status' => AttendanceLogStatus::Hadir->value,
            'punched_at' => CarbonImmutable::parse('2026-05-27 15:10:00', 'Asia/Makassar'),
        ],
        [
            'employee_id' => '10004',
            'status' => AttendanceLogStatus::Keluar->value,
            'punched_at' => CarbonImmutable::parse('2026-05-27 23:50:00', 'Asia/Makassar'),
        ],
    ]));

    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-27 18:05:00', 'Asia/Makassar'));

    $this->artisan('attendance:sync')->assertSuccessful();

    expect(AttendanceLog::query()->count())->toBe(2);

    $day = AttendanceDay::query()
        ->where('user_id', $user->id)
        ->whereDate('work_date', '2026-05-27')
        ->first();

    expect($day)->not->toBeNull()
        ->and($day->presence_status)->toBe(AttendancePresenceStatus::Hadir);

    CarbonImmutable::setTestNow();
});

test('schedule registers attendance sync three times daily', function () {
    $events = app(Schedule::class)->events();

    $attendanceEvents = collect($events)->filter(
        fn ($event) => str_contains($event->command ?? '', 'attendance:sync'),
    );

    expect($attendanceEvents)->toHaveCount(3);
});
