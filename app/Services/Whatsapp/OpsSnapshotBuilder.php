<?php

namespace App\Services\Whatsapp;

use App\Enums\RoleName;
use App\Models\Company;
use App\Models\Ticket;
use App\Models\User;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\SettingRepositoryInterface;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class OpsSnapshotBuilder
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly AttendanceDayRepositoryInterface $attendanceDays,
        private readonly ShiftAssignmentResolver $shiftResolver,
        private readonly SettingRepositoryInterface $settings,
    ) {}

    /**
     * Build morning snapshot text for a company.
     */
    public function buildMorning(Company $company): string
    {
        $timezone = config('app.timezone');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $dateStr = $today->translatedFormat('d M Y');

        $users = $this->getActiveUsers($company);
        $this->eagerLoadRelations($users, $today);

        $scheduled = [];
        $onLeave = [];
        $offDuty = [];

        foreach ($users as $user) {
            $shift = $this->shiftResolver->shiftForWorkDate($user, $today);
            $isWorkday = $shift !== null;
            $leave = $user->leaves->first(fn($l) => $today->between($l->start_date, $l->end_date));

            $attendanceDay = $user->attendanceDays
                ->first(fn($d) => $d->work_date->toDateString() === $today->toDateString());

            $checkIn = $attendanceDay?->check_in_at
                ? Carbon::parse($attendanceDay->check_in_at)->timezone($timezone)->format('H:i')
                : null;
            $checkOut = $attendanceDay?->check_out_at
                ? Carbon::parse($attendanceDay->check_out_at)->timezone($timezone)->format('H:i')
                : null;

            $s = [
                'user' => $user,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'attendance' => $attendanceDay,
                'isOff' => !$isWorkday,
            ];

            // Prioritize physical attendance over EVERYTHING (including leave or off-day)
            if ($checkIn !== null) {
                $scheduled[] = $s;
            } elseif ($leave) {
                $onLeave[] = ['user' => $user, 'type' => $leave->type];
            } elseif ($isWorkday) {
                $scheduled[] = $s;
            } else {
                $offDuty[] = $s;
            }
        }

        // Active tickets (Assigned, In Progress, Pending/On Hold)
        $userIds = $users->pluck('id')->toArray();
        $activeTickets = Ticket::query()
            ->whereNull('disappeared_at')
            ->whereIn('assigned_to_user_id', $userIds)
            ->whereIn('status', ['assigned', 'in_progress', 'pending_on_hold'])
            ->get();

        // Tickets Closed TODAY
        $closedTodayTickets = Ticket::query()
            ->whereNull('disappeared_at')
            ->whereIn('assigned_to_user_id', $userIds)
            ->where('status', 'closed')
            ->whereDate('completed_date', $today->toDateString())
            ->get();

        $lines = [];
        $companyName = $company->name ?? 'Team';

        // Header
        $lines[] = "📝 *[Morning Ops Snapshot – {$companyName} Team | {$dateStr} | 10.00 WITA]*";
        $lines[] = '';

        // On Duty / Leave
        $onDutyCount = count($scheduled);
        $leaveDesc = count($onLeave) > 0
            ? implode(', ', array_map(fn($l) => $l['user']->name . ' (' . $l['type'] . ')', $onLeave))
            : '-';

        $offUsersOnly = array_filter($offDuty, fn($o) => !$o['check_in'] && !$o['check_out']);
        $offDesc = count($offUsersOnly) > 0
            ? implode(', ', array_map(fn($o) => $o['user']->name, $offUsersOnly))
            : '-';

        $lines[] = "👥 On Duty: {$onDutyCount}";
        $lines[] = "🚫 On Leave/Sick: {$leaveDesc}";
        $lines[] = "🏖️ Off Duty (Libur): {$offDesc}";

        // Attendance
        $checkedIn = array_filter($scheduled, fn($s) => $s['check_in'] !== null);

        if (count($checkedIn) > 0) {
            $working = array_filter($checkedIn, fn($s) => $s['check_out'] === null);
            $completed = array_filter($checkedIn, fn($s) => $s['check_out'] !== null);
            $sortedCheckedIn = array_merge($working, $completed);

            $lines[] = '';
            $lines[] = "Attendance (per Engineer):";
            foreach ($sortedCheckedIn as $s) {
                $lines[] = $this->formatAttendanceLine($s, $s['isOff'] ?? false, $timezone);
            }
        }

        $notCheckedIn = array_filter($scheduled, fn($s) => $s['check_in'] === null);
        if (count($notCheckedIn) > 0) {
            $lines[] = '';
            $lines[] = "⚠️ Not yet checked in:";
            foreach ($notCheckedIn as $s) {
                $lines[] = " · {$s['user']->name}";
            }
        }

        $lines[] = '';

        // Full ticket stats
        $completedCount = $closedTodayTickets->count();
        $assignedCount = $activeTickets->where('status', 'assigned')->count();
        $inProgressCount = $activeTickets->where('status', 'in_progress')->count();
        $totalTickets = $completedCount + $assignedCount + $inProgressCount;

        $lines[] = "📊 Total Tickets (This Morning): " . $totalTickets
            . " (Completed Today: {$completedCount}, Assigned: {$assignedCount}, In Progress: {$inProgressCount})";



        // Assigned per engineer (Disabled for morning snapshot)
        // $assignedTickets = $activeTickets->where('status', 'assigned');
        // if ($assignedTickets->isNotEmpty()) {
        //     $assignedPerUser = $assignedTickets->groupBy('assigned_to_user_id');
        //     $parts = [];
        //     foreach ($assignedPerUser as $userId => $uTickets) {
        //         $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
        //         $parts[] = "{$userName} (" . $uTickets->count() . ")";
        //     }
        //     $lines[] = "📝 Assigned Tickets per Engineer: " . implode(', ', $parts);
        // } else {
        //     $lines[] = "📝 Assigned Tickets per Engineer: -";
        // }

        // Pending / On Hold per engineer (Disabled for morning snapshot)
        // $pending = $activeTickets->where('status', 'pending_on_hold');
        // if ($pending->isNotEmpty()) {
        //     $pendingPerUser = $pending->groupBy('assigned_to_user_id');
        //     $pendingParts = [];
        //     foreach ($pendingPerUser as $userId => $userTickets) {
        //         $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
        //         $pendingParts[] = "{$userName} (" . $userTickets->count() . ")";
        //     }
        //     $lines[] = "⏸️ Pending / On Hold per Engineer: " . implode(', ', $pendingParts);
        // } else {
        //     $lines[] = "⏸️ Pending / On Hold per Engineer: -";
        // }

        // Aging Tickets > N days
        $agingDays = (int) $this->settings->get('sla_aging_days', 3);
        $agingDate = $today->subDays($agingDays);
        $agingTickets = $activeTickets->filter(function ($t) use ($agingDate) {
            $createdAt = $t->api_creation_date ?? $t->first_seen_at;
            return $createdAt && CarbonImmutable::parse($createdAt)->lte($agingDate);
        });

        if ($agingTickets->isNotEmpty()) {
            $agingParts = [];
            foreach ($agingTickets as $t) {
                $assignedName = $users->firstWhere('id', $t->assigned_to_user_id)?->name ?? 'Unknown';
                $agingParts[] = "ID#{$t->ticket_no} ({$assignedName})";
            }
            $lines[] = "🕗 Aging Tickets >{$agingDays} Days: " . $agingTickets->count()
                . " ( " . implode(', ', $agingParts) . " )";
        } else {
            $lines[] = "🕗 Aging Tickets >{$agingDays} Days: -";
        }

        $lines[] = '';
        $lines[] = "📌 Note: Morning snapshot only reflects attendance & backlog. SLA performance will be updated in the evening report.";

        return implode("\n", $lines);
    }

    /**
     * Build evening snapshot text for a company.
     */
    public function buildEvening(Company $company): string
    {
        $timezone = config('app.timezone');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $dateStr = $today->translatedFormat('d M Y');

        $users = $this->getActiveUsers($company);
        $this->eagerLoadRelations($users, $today);

        $scheduled = [];
        $onLeave = [];
        $offDuty = [];

        foreach ($users as $user) {
            $shift = $this->shiftResolver->shiftForWorkDate($user, $today);
            $isWorkday = $shift !== null;
            $leave = $user->leaves->first(fn($l) => $today->between($l->start_date, $l->end_date));

            $attendanceDay = $user->attendanceDays
                ->first(fn($d) => $d->work_date->toDateString() === $today->toDateString());

            $checkIn = $attendanceDay?->check_in_at
                ? Carbon::parse($attendanceDay->check_in_at)->timezone($timezone)->format('H:i')
                : null;
            $checkOut = $attendanceDay?->check_out_at
                ? Carbon::parse($attendanceDay->check_out_at)->timezone($timezone)->format('H:i')
                : null;

            $s = [
                'user' => $user,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'attendance' => $attendanceDay,
                'isOff' => !$isWorkday,
            ];

            // Prioritize physical attendance over EVERYTHING (including leave or off-day)
            if ($checkIn !== null) {
                $scheduled[] = $s;
            } elseif ($leave) {
                $onLeave[] = ['user' => $user, 'type' => $leave->type];
            } elseif ($isWorkday) {
                $scheduled[] = $s;
            } else {
                $offDuty[] = $s;
            }
        }

        // Active tickets (Assigned, In Progress, Pending/On Hold)
        $userIds = $users->pluck('id')->toArray();
        $activeTickets = Ticket::query()
            ->whereNull('disappeared_at')
            ->whereIn('assigned_to_user_id', $userIds)
            ->whereIn('status', ['assigned', 'in_progress', 'pending_on_hold'])
            ->get();

        // Tickets Closed TODAY
        $closedTodayTickets = Ticket::query()
            ->whereNull('disappeared_at')
            ->whereIn('assigned_to_user_id', $userIds)
            ->where('status', 'closed')
            ->whereDate('completed_date', $today->toDateString())
            ->get();

        $lines = [];
        $companyName = $company->name ?? 'Team';
        $workTarget = (int) $this->settings->get('sla_work_duration_hours', 8);

        // Header
        $lines[] = "📝 *[Evening Ops Snapshot – {$companyName} Team | {$dateStr} | 19.00 WITA]*";
        $lines[] = '';

        // On Duty / Leave
        $onDutyCount = count($scheduled);
        $leaveDesc = count($onLeave) > 0
            ? implode(', ', array_map(fn($l) => $l['user']->name . ' (' . $l['type'] . ')', $onLeave))
            : '-';
            
        $offUsersOnly = array_filter($offDuty, fn($o) => !$o['check_in'] && !$o['check_out']);
        $offDesc = count($offUsersOnly) > 0
            ? implode(', ', array_map(fn($o) => $o['user']->name, $offUsersOnly))
            : '-';

        $lines[] = "👥 On Duty: {$onDutyCount}";
        $lines[] = "🚫 On Leave/Sick: {$leaveDesc}";
        $lines[] = "🏖️ Off Duty (Libur): {$offDesc}";
        $lines[] = '';

        // Work Duration
        $lines[] = "⏱ Work Duration ({$workTarget} hours from check-in):";
        $lines[] = '';

        $totalScheduled = count($scheduled);
        $i = 0;
        foreach ($scheduled as $s) {
            $lines[] = $this->formatAttendanceLine($s, $s['isOff'] ?? false, $timezone, true);
            if (++$i < $totalScheduled) {
                $lines[] = '';
            }
        }

        $lines[] = '';

        // Full ticket stats
        $completedCount = $closedTodayTickets->count();
        $assignedCount = $activeTickets->where('status', 'assigned')->count();
        $inProgressCount = $activeTickets->where('status', 'in_progress')->count();
        $totalTickets = $completedCount + $assignedCount + $inProgressCount;

        $lines[] = "📊 Total Tickets: " . $totalTickets
            . " (Completed Today: {$completedCount}, Assigned: {$assignedCount}, In Progress: {$inProgressCount})";



        // Assigned per engineer (Disabled for evening snapshot)
        // $assignedTickets = $activeTickets->where('status', 'assigned');
        // if ($assignedTickets->isNotEmpty()) {
        //     $assignedPerUser = $assignedTickets->groupBy('assigned_to_user_id');
        //     $parts = [];
        //     foreach ($assignedPerUser as $userId => $uTickets) {
        //         $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
        //         $parts[] = "{$userName} (" . $uTickets->count() . ")";
        //     }
        //     $lines[] = "📝 Assigned Tickets per Engineer: " . implode(', ', $parts);
        // } else {
        //     $lines[] = "📝 Assigned Tickets per Engineer: -";
        // }

        // Pending / On Hold per engineer (Disabled for evening snapshot)
        // $pending = $activeTickets->where('status', 'pending_on_hold');
        // if ($pending->isNotEmpty()) {
        //     $pendingPerUser = $pending->groupBy('assigned_to_user_id');
        //     $pendingParts = [];
        //     foreach ($pendingPerUser as $userId => $userTickets) {
        //         $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
        //         $pendingParts[] = "{$userName} (" . $userTickets->count() . ")";
        //     }
        //     $lines[] = "⏸️ Pending / On Hold per Engineer: " . implode(', ', $pendingParts);
        // } else {
        //     $lines[] = "⏸️ Pending / On Hold per Engineer: -";
        // }

        // Aging Tickets > N days
        $agingDays = (int) $this->settings->get('sla_aging_days', 3);
        $agingDate = $today->subDays($agingDays);
        $agingTickets = $activeTickets->filter(function ($t) use ($agingDate) {
            $createdAt = $t->api_creation_date ?? $t->first_seen_at;
            return $createdAt && CarbonImmutable::parse($createdAt)->lte($agingDate);
        });

        if ($agingTickets->isNotEmpty()) {
            $agingParts = [];
            foreach ($agingTickets as $t) {
                $assignedName = $users->firstWhere('id', $t->assigned_to_user_id)?->name ?? 'Unknown';
                $agingParts[] = "ID#{$t->ticket_no} ({$assignedName})";
            }
            $lines[] = "🕗 Aging Tickets >{$agingDays} Days: " . $agingTickets->count()
                . " ( " . implode(', ', $agingParts) . " )";
        } else {
            $lines[] = "🕗 Aging Tickets >{$agingDays} Days: -";
        }

        // High Ticket Load (>=N in 24 hours)
        $highLoadThreshold = (int) $this->settings->get('sla_high_ticket_load', 10);
        $last24h = CarbonImmutable::now($timezone)->subHours(24);
        
        $recentTickets = Ticket::query()
            ->whereNull('disappeared_at')
            ->whereIn('assigned_to_user_id', $userIds)
            ->where(function ($query) use ($last24h) {
                $query->where('api_creation_date', '>=', $last24h)
                      ->orWhere(function ($q) use ($last24h) {
                          $q->whereNull('api_creation_date')
                            ->where('first_seen_at', '>=', $last24h);
                      });
            })
            ->get();

        $recentPerUser = $recentTickets->groupBy('assigned_to_user_id');
        $highLoadUsers = [];
        foreach ($recentPerUser as $userId => $uTickets) {
            if ($uTickets->count() >= $highLoadThreshold) {
                $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
                $highLoadUsers[] = "{$userName} (" . $uTickets->count() . ")";
            }
        }
        if (!empty($highLoadUsers)) {
            $lines[] = "🔥 High Ticket Load (>={$highLoadThreshold}) (24 hours): " . implode(', ', $highLoadUsers);
        } else {
            $lines[] = "🔥 High Ticket Load (>={$highLoadThreshold}) (24 hours): -";
        }

        // Top Performer (most closed tickets TODAY)
        if ($closedTodayTickets->isNotEmpty()) {
            $closedPerUser = $closedTodayTickets->groupBy('assigned_to_user_id');
            $topUserId = $closedPerUser->sortByDesc(fn($items) => $items->count())->keys()->first();
            $topUser = $users->firstWhere('id', $topUserId);
            $topCount = $closedPerUser->get($topUserId)?->count() ?? 0;
            if ($topUser) {
                $lines[] = "🏆 Top Performer Today: {$topUser->name} ({$topCount} closed)";
            }
        }else{
            $lines[] = "🏆 Top Performer Today: -";
        }

        $lines[] = '';

        // Avg Response Time & Resolution Time
        $responseThreshold = (int) $this->settings->get('sla_response_time_green', 60);
        $resolutionThreshold = (int) $this->settings->get('sla_resolution_time_green', 120);

        $avgResponseMin = $closedTodayTickets->isNotEmpty()
            ? round($closedTodayTickets->avg(function ($t) {
                $sec = $t->response_time_seconds ?? 0;
                return $sec <= 0 ? 60 : $sec; // 60 seconds = 1 minute
            }) / 60)
            : 0;

        $avgResolutionMin = $closedTodayTickets->isNotEmpty()
            ? round($closedTodayTickets->avg(function ($t) {
                $min = ((float)($t->resolution_time ?? 0)) * 60;
                return $min <= 0 ? 1 : $min; // Minimum 1 minute
            }))
            : 0;

        $formatMinutes = function ($minutes) {
            if ($minutes >= 60) {
                $h = intdiv((int)$minutes, 60);
                $m = (int)$minutes % 60;
                return $m > 0 ? "{$h}h {$m}m" : "{$h}h";
            }
            return "{$minutes}m";
        };

        $lines[] = "⚡ Avg Response Time: (" . $formatMinutes($avgResponseMin) . ")";
        $lines[] = "📊 Avg Resolution Time: (" . $formatMinutes($avgResolutionMin) . ")";

        $lines[] = '';

        // Engineer Compliance Performance
        if ($closedTodayTickets->isNotEmpty()) {
            $lines[] = "🎯 Engineer Compliance Performance (Today's Closed)";
        }
        $totalSlaTickets = 0;
        $totalLateSla = 0;

        foreach ($users as $user) {
            $userClosed = $closedTodayTickets->where('assigned_to_user_id', $user->id);
            if ($userClosed->isEmpty()) {
                continue;
            }

            $count = $userClosed->count();
            $lateCount = 0;

            foreach ($userClosed as $t) {
                $responseSec = (int) ($t->response_time_seconds ?? 0);
                $responseMin = $responseSec <= 0 ? 1 : ($responseSec / 60);
                $resolutionMin = ((float) ($t->resolution_time ?? 0)) * 60;

                if ($responseMin > $responseThreshold || $resolutionMin > $resolutionThreshold) {
                    $lateCount++;
                }
            }

            $slaPercent = $count > 0 ? round((($count - $lateCount) / $count) * 100) : 0;
            $onTimeCount = $count - $lateCount;

            $slaIcon = $slaPercent >= 90 ? '🟢' : ($slaPercent >= 70 ? '🟡' : '🔴');

            $lines[] = "{$slaIcon} {$user->name}: {$slaPercent}% Compliance";
            $lines[] = "└ {$onTimeCount}/{$count} tiket ({$lateCount} late)";

            $totalSlaTickets += $count;
            $totalLateSla += $lateCount;
        }

        // Team average Compliance
        if ($totalSlaTickets > 0) {
            $teamSla = round((($totalSlaTickets - $totalLateSla) / $totalSlaTickets) * 100);
            $teamIcon = $teamSla >= 90 ? '🟢' : ($teamSla >= 70 ? '🟡' : '🔴');
            $onTimeTeam = $totalSlaTickets - $totalLateSla;

            $lines[] = '';
            $lines[] = "🏅 Team Average Compliance: {$teamSla}% ({$onTimeTeam}/{$totalSlaTickets} tiket)";
            $lines[] = "{$teamIcon} Status: " . ($teamSla >= 90 ? 'Excellent Compliance' : ($teamSla >= 70 ? 'Good Compliance' : 'Needs Improvement'));
        }

        $lines[] = '';
        $lines[] = "📌 Note: Snapshot is generated at 10:00 & 19:00 WITA. Please review ticket progress, distribution, attendance, and any unresolved issues.";

        return implode("\n", $lines);
    }

    /**
     * Ambil user aktif dari company.
     *
     * @return Collection<int, User>
     */
    private function getActiveUsers(Company $company): Collection
    {
        return User::where('company_id', $company->id)
            ->where('is_active', true)
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', RoleName::PoolAccount->value);
            })
            ->orderBy('name')
            ->get();
    }

    /**
     * Eager load relations yang dibutuhkan.
     */
    private function eagerLoadRelations(Collection $users, CarbonImmutable $today): void
    {
        $users->load([
            'leaves' => fn($q) => $q->approved(),
            'shiftAssignments',
            'exceptions',
            'attendanceDays' => fn($q) => $q->where('work_date', $today->toDateString()),
        ]);
    }

    private function formatAttendanceLine(array $s, bool $isOff, string $timezone, bool $isEvening = false): string
    {
        $name = $s['user']->name;
        $inTime = $s['check_in'] ?? '-';
        $outTime = $s['check_out'] ?? '-';
        $prefix = $isOff ? " [LIBUR]" : "";

        if ($isOff && !$s['check_in'] && !$s['check_out']) {
            return "─ {$name} – 🏖️ Off Duty (Libur)";
        }

        if ($s['check_in'] && $s['check_out'] && $s['attendance']) {
            $checkInCarbon = Carbon::parse($s['attendance']->check_in_at)->timezone($timezone);
            $checkOutCarbon = Carbon::parse($s['attendance']->check_out_at)->timezone($timezone);
            $workedMinutes = $checkInCarbon->diffInMinutes($checkOutCarbon);
            $workedH = intdiv($workedMinutes, 60);
            $workedM = $workedMinutes % 60;
            $workedStr = "{$workedH}h {$workedM}m";

            if ($isOff) {
                return "─ {$name}{$prefix} – In: {$inTime}, Out: {$outTime} 🚀 Worked on day off! (Worked: {$workedStr})";
            }

            $overtime = $s['attendance']->overtime_minutes ?? 0;
            $early = $s['attendance']->early_leave_minutes ?? 0;
            $late = $s['attendance']->late_minutes ?? 0;

            $anomalies = [];
            if ($late > 0) $anomalies[] = "Late {$late}m";
            if ($early > 0) $anomalies[] = "Early leave {$early}m";

            if ($overtime > 0) {
                return "─ {$name} – In: {$inTime}, Out: {$outTime} ✅ Extended time by {$overtime}m (Worked: {$workedStr})";
            } elseif (!empty($anomalies)) {
                $anomalyStr = implode(', ', $anomalies);
                return "─ {$name} – In: {$inTime}, Out: {$outTime} ⚠️ {$anomalyStr} (Worked: {$workedStr})";
            } else {
                return "─ {$name} – In: {$inTime}, Out: {$outTime} ✅ Perfect schedule (Worked: {$workedStr})";
            }
        } elseif ($s['check_in'] && !$s['check_out']) {
            if ($isEvening) {
                return "─ {$name}{$prefix} – In: {$inTime} ⏳ Still Working";
            }
            return "─ {$name}{$prefix} – In: {$inTime}";
        } else {
            return "─ {$name}{$prefix} – In: -, Out: - ❌ No attendance data";
        }
    }
}
