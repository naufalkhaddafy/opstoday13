<?php

namespace App\Services\Whatsapp;

use App\Helpers\SlaConstants;
use App\Models\Company;
use App\Models\Ticket;
use App\Models\User;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
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
            $assignment = $this->shiftResolver->forWorkDate($user, $today);
            $isWorkday = $assignment !== null && $assignment->isActiveOn($today);
            $leave = $user->leaves->first(fn($l) => $today->between($l->start_date, $l->end_date));

            $attendanceDay = $user->attendanceDays
                ->first(fn($d) => $d->work_date->toDateString() === $today->toDateString());

            $checkIn = $attendanceDay?->check_in_at
                ? Carbon::parse($attendanceDay->check_in_at)->timezone($timezone)->format('H:i')
                : null;
            $checkOut = $attendanceDay?->check_out_at
                ? Carbon::parse($attendanceDay->check_out_at)->timezone($timezone)->format('H:i')
                : null;

            if ($leave) {
                $onLeave[] = ['user' => $user, 'type' => $leave->type];
            } elseif ($isWorkday) {
                $scheduled[] = [
                    'user' => $user,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'attendance' => $attendanceDay,
                ];
            } else {
                $offDuty[] = [
                    'user' => $user,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'attendance' => $attendanceDay,
                ];
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
            $lines[] = '';
            $lines[] = "Attendance (per Engineer):";
            foreach ($checkedIn as $s) {
                $lines[] = $this->formatAttendanceLine($s, false, $timezone);
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

        // No ticket assigned (excluding those who already closed a ticket today)
        $usersWithActiveTickets = $activeTickets->pluck('assigned_to_user_id')->unique()->toArray();
        $usersWithClosedTickets = $closedTodayTickets->pluck('assigned_to_user_id')->unique()->toArray();
        $usersWithAnyTickets = array_unique(array_merge($usersWithActiveTickets, $usersWithClosedTickets));

        $noTicketUsers = $users->filter(fn($u) => !in_array($u->id, $usersWithAnyTickets));
        if ($noTicketUsers->isNotEmpty()) {
            $lines[] = "⛔ No Ticket Assigned: " . $noTicketUsers->pluck('name')->implode(', ');
        }

        // Assigned per engineer
        $assignedTickets = $activeTickets->where('status', 'assigned');
        if ($assignedTickets->isNotEmpty()) {
            $assignedPerUser = $assignedTickets->groupBy('assigned_to_user_id');
            $parts = [];
            foreach ($assignedPerUser as $userId => $uTickets) {
                $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
                $parts[] = "{$userName} (" . $uTickets->count() . ")";
            }
            $lines[] = "📝 Assigned Tickets per Engineer: " . implode(', ', $parts);
        } else {
            $lines[] = "📝 Assigned Tickets per Engineer: -";
        }

        // Pending / On Hold per engineer
        $pending = $activeTickets->where('status', 'pending_on_hold');
        if ($pending->isNotEmpty()) {
            $pendingPerUser = $pending->groupBy('assigned_to_user_id');
            $pendingParts = [];
            foreach ($pendingPerUser as $userId => $userTickets) {
                $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
                $pendingParts[] = "{$userName} (" . $userTickets->count() . ")";
            }
            $lines[] = "⏸️ Pending / On Hold per Engineer: " . implode(', ', $pendingParts);
        } else {
            $lines[] = "⏸️ Pending / On Hold per Engineer: -";
        }

        // Aging Tickets > N days
        $agingDays = SlaConstants::AGING_DAYS;
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
            $assignment = $this->shiftResolver->forWorkDate($user, $today);
            $isWorkday = $assignment !== null && $assignment->isActiveOn($today);
            $leave = $user->leaves->first(fn($l) => $today->between($l->start_date, $l->end_date));

            $attendanceDay = $user->attendanceDays
                ->first(fn($d) => $d->work_date->toDateString() === $today->toDateString());

            $checkIn = $attendanceDay?->check_in_at
                ? Carbon::parse($attendanceDay->check_in_at)->timezone($timezone)->format('H:i')
                : null;
            $checkOut = $attendanceDay?->check_out_at
                ? Carbon::parse($attendanceDay->check_out_at)->timezone($timezone)->format('H:i')
                : null;

            if ($leave) {
                $onLeave[] = ['user' => $user, 'type' => $leave->type];
            } elseif ($isWorkday) {
                $scheduled[] = [
                    'user' => $user,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'attendance' => $attendanceDay,
                ];
            } else {
                $offDuty[] = [
                    'user' => $user,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'attendance' => $attendanceDay,
                ];
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
        $workTarget = SlaConstants::WORK_DURATION_HOURS;

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
            $lines[] = $this->formatAttendanceLine($s, false, $timezone);
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

        // No ticket assigned (excluding those who already closed a ticket today)
        $usersWithActiveTickets = $activeTickets->pluck('assigned_to_user_id')->unique()->toArray();
        $usersWithClosedTickets = $closedTodayTickets->pluck('assigned_to_user_id')->unique()->toArray();
        $usersWithAnyTickets = array_unique(array_merge($usersWithActiveTickets, $usersWithClosedTickets));

        $noTicketUsers = $users->filter(fn($u) => !in_array($u->id, $usersWithAnyTickets));
        if ($noTicketUsers->isNotEmpty()) {
            $lines[] = "⛔ No Ticket Assigned: " . $noTicketUsers->pluck('name')->implode(', ');
        }

        // Assigned per engineer
        $assignedTickets = $activeTickets->where('status', 'assigned');
        if ($assignedTickets->isNotEmpty()) {
            $assignedPerUser = $assignedTickets->groupBy('assigned_to_user_id');
            $parts = [];
            foreach ($assignedPerUser as $userId => $uTickets) {
                $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
                $parts[] = "{$userName} (" . $uTickets->count() . ")";
            }
            $lines[] = "📝 Assigned Tickets per Engineer: " . implode(', ', $parts);
        } else {
            $lines[] = "📝 Assigned Tickets per Engineer: -";
        }

        // Pending / On Hold per engineer
        $pending = $activeTickets->where('status', 'pending_on_hold');
        if ($pending->isNotEmpty()) {
            $pendingPerUser = $pending->groupBy('assigned_to_user_id');
            $pendingParts = [];
            foreach ($pendingPerUser as $userId => $userTickets) {
                $userName = $users->firstWhere('id', $userId)?->name ?? 'Unknown';
                $pendingParts[] = "{$userName} (" . $userTickets->count() . ")";
            }
            $lines[] = "⏸️ Pending / On Hold per Engineer: " . implode(', ', $pendingParts);
        } else {
            $lines[] = "⏸️ Pending / On Hold per Engineer: -";
        }

        // Aging Tickets > N days
        $agingDays = SlaConstants::AGING_DAYS;
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
        $highLoadThreshold = SlaConstants::HIGH_TICKET_LOAD;
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
        $responseThreshold = SlaConstants::RESPONSE_TIME_GREEN;
        $resolutionThreshold = SlaConstants::RESOLUTION_TIME_GREEN;

        $ticketsWithResponse = $closedTodayTickets->filter(fn($t) => ($t->response_time_seconds ?? 0) > 0);
        $avgResponseMin = $ticketsWithResponse->isNotEmpty()
            ? round($ticketsWithResponse->avg('response_time_seconds') / 60)
            : 0;

        $closedWithResolution = $closedTodayTickets->filter(function ($t) {
            $created = $t->api_creation_date ?? $t->first_seen_at;
            return $created && $t->completed_date;
        });
        $avgResolutionMin = 0;
        if ($closedWithResolution->isNotEmpty()) {
            $totalResMin = 0;
            foreach ($closedWithResolution as $t) {
                $created = CarbonImmutable::parse($t->api_creation_date ?? $t->first_seen_at);
                $completed = CarbonImmutable::parse($t->completed_date);
                $totalResMin += $created->diffInMinutes($completed);
            }
            $avgResolutionMin = round($totalResMin / $closedWithResolution->count());
        }

        $lines[] = "⚡ Avg Response Time: ({$avgResponseMin}m)";
        $lines[] = "📊 Avg Resolution Time: ({$avgResolutionMin}m)";

        $lines[] = '';

        // Engineer SLA Performance
        $lines[] = "🎯 Engineer SLA Performance (Today's Closed)";
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
                $responseMin = ($t->response_time_seconds ?? 0) / 60;
                if ($responseMin > $responseThreshold) {
                    $lateCount++;
                }
            }

            $slaPercent = $count > 0 ? round((($count - $lateCount) / $count) * 100) : 0;

            $slaIcon = $slaPercent >= 90 ? '🟢' : ($slaPercent >= 70 ? '🟡' : '🔴');

            $lines[] = "{$slaIcon} {$user->name}: {$slaPercent}% SLA";
            $lines[] = "└ {$count}/{$count} tiket ({$lateCount} late)";

            $totalSlaTickets += $count;
            $totalLateSla += $lateCount;
        }

        // Team average SLA
        if ($totalSlaTickets > 0) {
            $teamSla = round((($totalSlaTickets - $totalLateSla) / $totalSlaTickets) * 100);
            $teamIcon = $teamSla >= 90 ? '🟢' : ($teamSla >= 70 ? '🟡' : '🔴');

            $lines[] = '';
            $lines[] = "🏅 Team Average SLA: {$teamSla}% ({$totalSlaTickets}/{$totalSlaTickets} tiket)";
            $lines[] = "{$teamIcon} Status: " . ($teamSla >= 90 ? 'Excellent SLA Compliance' : ($teamSla >= 70 ? 'Good SLA Compliance' : 'Needs Improvement'));
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

    private function formatAttendanceLine(array $s, bool $isOff, string $timezone): string
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
            return "─ {$name}{$prefix} – In: {$inTime}";
        } else {
            return "─ {$name}{$prefix} – In: -, Out: - ❌ No attendance data";
        }
    }
}
