<?php

namespace App\Http\Controllers;

use App\Enums\RoleName;
use App\Http\Resources\DashboardPageResource;
use App\Models\Ticket;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Repositories\Contracts\HolidayRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly AttendanceDayRepositoryInterface $attendanceDays,
    ) {}

    public function index(Request $request, ShiftAssignmentResolver $shiftResolver): Response
    {
        $timezone = config('app.timezone');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $user = $request->user();

        if ($user->hasRole(RoleName::Engineer->value)) {
            return $this->engineerDashboard($request, $user, $today, $shiftResolver);
        }

        // SPV / SuperAdmin: existing admin overview
        return $this->adminDashboard($today, $shiftResolver);
    }

    private function adminDashboard(CarbonImmutable $today, ShiftAssignmentResolver $shiftResolver): Response
    {
        $users = $this->users->activeForDashboard($today->toDateString(), $today->toDateString());

        $ticketCounts = Ticket::query()
            ->whereNull('disappeared_at')
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN status = 'pending_on_hold' THEN 1 ELSE 0 END) as pending
            ")
            ->whereYear('api_creation_date', $today->year)
            ->whereMonth('api_creation_date', $today->month)
            ->first();

        return Inertia::render(
            'dashboard',
            DashboardPageResource::make([
                'view' => 'admin',
                'users' => $users,
                'today' => $today,
                'shiftResolver' => $shiftResolver,
                'tickets' => [
                    'total' => $ticketCounts->total ?? 0,
                    'closed' => $ticketCounts->closed ?? 0,
                    'in_progress' => $ticketCounts->in_progress ?? 0,
                    'assigned' => $ticketCounts->assigned ?? 0,
                    'pending' => $ticketCounts->pending ?? 0,
                ],
            ])->resolve()
        );
    }

    private function engineerDashboard(Request $request, $user, CarbonImmutable $today, ShiftAssignmentResolver $shiftResolver): Response
    {
        $timezone = config('app.timezone');
        $month = $today->month;
        $year = $today->year;

        $startOfMonth = CarbonImmutable::create($year, $month, 1, 0, 0, 0, $timezone);
        $endOfMonth = $startOfMonth->endOfMonth();

        // Load attendance data for this month
        $attendanceDays = $this->attendanceDays->getForUserInDateRange($user, $startOfMonth, $endOfMonth)
            ->keyBy(fn ($record) => $record->work_date->toDateString());

        // Load relations needed for shift resolution
        $relationsToLoad = [];
        if (! $user->relationLoaded('leaves')) {
            $relationsToLoad['leaves'] = fn($q) => $q->approved();
        }
        if (! $user->relationLoaded('shiftAssignments')) {
            $relationsToLoad[] = 'shiftAssignments';
        }
        if (! $user->relationLoaded('exceptions')) {
            $relationsToLoad[] = 'exceptions';
        }
        if (! empty($relationsToLoad)) {
            $user->load($relationsToLoad);
        }

        // Current shift
        $currentAssignment = $shiftResolver->forWorkDate($user, $today);
        $currentShift = $currentAssignment ? $shiftResolver->shiftForWorkDate($user, $today) : null;

        // Today's attendance
        $todayRecord = $attendanceDays->get($today->toDateString());
        $todayLeave = $user->leaves->first(fn($l) => $today->between($l->start_date, $l->end_date));

        $todayStatus = 'off_day';
        $todayCheckIn = null;
        $todayCheckOut = null;

        if ($todayRecord) {
            $todayStatus = $todayRecord->presence_status->value;
            $todayCheckIn = $todayRecord->check_in_at
                ? CarbonImmutable::parse($todayRecord->check_in_at)->timezone($timezone)->format('H:i')
                : null;
            $todayCheckOut = $todayRecord->check_out_at
                ? CarbonImmutable::parse($todayRecord->check_out_at)->timezone($timezone)->format('H:i')
                : null;
        } elseif ($todayLeave) {
            $todayStatus = $todayLeave->type;
        } elseif ($currentAssignment && $currentAssignment->isActiveOn($today)) {
            $todayStatus = 'scheduled'; // scheduled but not yet checked in
        } elseif (app(HolidayRepositoryInterface::class)->isHoliday($today->toDateString())) {
            $todayStatus = 'holiday';
        }

        // Monthly summary
        $summary = [
            'total_scheduled' => 0,
            'total_present' => 0,
            'total_absent' => 0,
            'total_late_days' => 0,
            'total_late_minutes' => 0,
            'total_cuti' => 0,
            'total_sakit' => 0,
            'total_izin' => 0,
        ];

        $totalDays = $startOfMonth->daysInMonth;
        for ($day = 1; $day <= $totalDays; $day++) {
            $date = $startOfMonth->setDay($day);
            $dateString = $date->toDateString();
            $assignment = $shiftResolver->forWorkDate($user, $date);
            $shift = $shiftResolver->shiftForWorkDate($user, $date);
            $isWorkday = $shift !== null;
            $dbRecord = $attendanceDays->get($dateString);
            $activeLeave = $user->leaves->first(fn($l) =>
                $l->start_date->toDateString() <= $dateString && $l->end_date->toDateString() >= $dateString
            );

            if ($activeLeave) {
                $summary['total_scheduled']++;
                $type = $activeLeave->type;
                if (in_array($type, ['cuti', 'sakit', 'izin'])) {
                    $summary["total_{$type}"]++;
                }
            } elseif ($dbRecord) {
                $status = $dbRecord->presence_status->value;
                if (in_array($status, ['hadir', 'tidak_lengkap'])) {
                    $summary['total_scheduled']++;
                    $summary['total_present']++;
                    if (($dbRecord->late_minutes ?? 0) > 0) {
                        $summary['total_late_days']++;
                        $summary['total_late_minutes'] += $dbRecord->late_minutes;
                    }
                } elseif (in_array($status, ['absen', 'tidak_hadir'])) {
                    $summary['total_scheduled']++;
                    $summary['total_absent']++;
                } elseif (in_array($status, ['cuti', 'sakit', 'izin'])) {
                    $summary['total_scheduled']++;
                    $summary["total_{$status}"]++;
                }
            } elseif ($isWorkday) {
                $summary['total_scheduled']++;
                if ($date->isPast() && !$date->isToday()) {
                    $summary['total_absent']++;
                }
            }
        }

        // Recent attendance (last 7 working days)
        $recentAttendance = [];
        $dateCheck = $today;
        $count = 0;
        while ($count < 7 && $dateCheck->gte($startOfMonth)) {
            $dateStr = $dateCheck->toDateString();
            $dbRecord = $attendanceDays->get($dateStr);
            $assignment = $shiftResolver->forWorkDate($user, $dateCheck);
            $shift = $shiftResolver->shiftForWorkDate($user, $dateCheck);
            $isWorkday = $shift !== null;
            $isHoliday = app(HolidayRepositoryInterface::class)->isHoliday($dateStr);
            $activeLeave = $user->leaves->first(fn($l) =>
                $l->start_date->toDateString() <= $dateStr && $l->end_date->toDateString() >= $dateStr
            );

            if ($isWorkday || $dbRecord || $activeLeave || $isHoliday) {
                $status = $isHoliday ? 'holiday' : 'off_day';
                $checkIn = null;
                $checkOut = null;
                $late = 0;

                if ($dbRecord) {
                    $status = $dbRecord->presence_status->value;
                    $checkIn = $dbRecord->check_in_at
                        ? CarbonImmutable::parse($dbRecord->check_in_at)->timezone($timezone)->format('H:i')
                        : null;
                    $checkOut = $dbRecord->check_out_at
                        ? CarbonImmutable::parse($dbRecord->check_out_at)->timezone($timezone)->format('H:i')
                        : null;
                    $late = $dbRecord->late_minutes ?? 0;
                } elseif ($activeLeave) {
                    $status = $activeLeave->type;
                } elseif ($isWorkday && $dateCheck->isPast() && !$dateCheck->isToday()) {
                    $status = 'tidak_hadir';
                } elseif ($isWorkday) {
                    $status = 'scheduled';
                }

                $recentAttendance[] = [
                    'date' => $dateStr,
                    'day_name' => $dateCheck->translatedFormat('D'),
                    'shift_name' => $shift?->name ?? '-',
                    'shift_time' => $shift ? substr($shift->start_time, 0, 5).' - '.substr($shift->end_time, 0, 5) : '-',
                    'status' => $status,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'late_minutes' => $late,
                ];
                $count++;
            }

            $dateCheck = $dateCheck->subDay();
        }

        // Tickets summary
        $ticketCounts = Ticket::query()
            ->whereNull('disappeared_at')
            ->where('assigned_to_user_id', $user->id)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN status = 'pending_on_hold' THEN 1 ELSE 0 END) as pending
            ")
            ->first();

        return Inertia::render(
            'dashboard',
            [
                'view' => 'engineer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'employee_id' => $user->employee_id,
                    'company' => $user->company?->name,
                    'group' => $user->group?->name,
                ],
                'date' => $today->translatedFormat('l, d F Y'),
                'today' => [
                    'status' => $todayStatus,
                    'check_in' => $todayCheckIn,
                    'check_out' => $todayCheckOut,
                    'shift' => $currentShift ? [
                        'name' => $currentShift->name,
                        'code' => $currentShift->code,
                        'start_time' => substr($currentShift->start_time, 0, 5),
                        'end_time' => substr($currentShift->end_time, 0, 5),
                    ] : null,
                ],
                'summary' => $summary,
                'recentAttendance' => $recentAttendance,
                'tickets' => [
                    'total' => $ticketCounts->total ?? 0,
                    'closed' => $ticketCounts->closed ?? 0,
                    'in_progress' => $ticketCounts->in_progress ?? 0,
                    'assigned' => $ticketCounts->assigned ?? 0,
                    'pending' => $ticketCounts->pending ?? 0,
                ],
            ]
        );
    }
}
