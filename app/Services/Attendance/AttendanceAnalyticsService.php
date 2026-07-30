<?php

namespace App\Services\Attendance;

use App\Enums\AttendancePresenceStatus;
use App\Helpers\AttendanceConstants;
use App\Models\AttendanceDay;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class AttendanceAnalyticsService
{
    /**
     * @return Collection<int, array>
     */
    public function getDisciplineLeaderboard(CarbonImmutable $dateFrom, CarbonImmutable $dateTo, ?int $companyId, ?string $workGroup = null): Collection
    {
        $query = AttendanceDay::query()
            ->with('user:id,name,employee_id,company_id')
            ->whereBetween('work_date', [$dateFrom->toDateString(), $dateTo->toDateString()]);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($workGroup) {
            $query->whereHas('user.group', function ($gq) use ($workGroup) {
                $gq->where('name', $workGroup);
            });
        }

        $records = $query->get();

        $userStats = [];

        foreach ($records as $record) {
            $userId = $record->user_id;
            if (!isset($userStats[$userId])) {
                $userStats[$userId] = [
                    'user' => clone $record->user,
                    'total_late_minutes' => 0, // gross late minutes for display
                    'total_penalized_late_minutes' => 0, // late minutes after daily grace period
                    'total_overtime_minutes' => 0, // accumulated overtime
                    'late_days' => 0,
                    'mangkir_days' => 0,
                    'score' => 100,
                ];
            }

            // Calculate penalty for late minutes (applying grace period per day)
            $lateMinutes = $record->late_minutes ?? 0;
            if ($lateMinutes > 0) {
                $userStats[$userId]['total_late_minutes'] += $lateMinutes;
                $userStats[$userId]['late_days']++;
                
                $penalizedMinutes = max(0, $lateMinutes - AttendanceConstants::LATE_GRACE_MINUTES);
                $userStats[$userId]['total_penalized_late_minutes'] += $penalizedMinutes;
            }

            // Accumulate overtime minutes
            $overtimeMinutes = $record->overtime_minutes ?? 0;
            if ($overtimeMinutes > 0) {
                $userStats[$userId]['total_overtime_minutes'] += $overtimeMinutes;
            }

            // Calculate penalty for mangkir (absent without reason)
            $status = $record->presence_status;
            if ($status === AttendancePresenceStatus::Absen || $status === AttendancePresenceStatus::TidakHadir) {
                $userStats[$userId]['mangkir_days']++;
                $userStats[$userId]['score'] -= 10;
            }
        }

        // Apply overtime to offset penalized late minutes
        foreach ($userStats as $userId => &$stat) {
            $netPenalizedMinutes = max(0, $stat['total_penalized_late_minutes'] - $stat['total_overtime_minutes']);
            $stat['score'] -= ($netPenalizedMinutes / 10);
        }
        unset($stat);

        // Format and sort
        $leaderboard = collect($userStats)->map(function ($stat) {
            return [
                'user_id' => $stat['user']->id,
                'name' => $stat['user']->name,
                'employee_id' => $stat['user']->employee_id,
                'total_late_minutes' => $stat['total_late_minutes'],
                'total_overtime_minutes' => $stat['total_overtime_minutes'],
                'net_penalized_minutes' => max(0, $stat['total_penalized_late_minutes'] - $stat['total_overtime_minutes']),
                'late_days' => $stat['late_days'],
                'mangkir_days' => $stat['mangkir_days'],
                'score' => round($stat['score'], 1),
            ];
        })->sort(function ($a, $b) {
            if ($a['score'] === $b['score']) {
                return $b['total_overtime_minutes'] <=> $a['total_overtime_minutes'];
            }
            return $b['score'] <=> $a['score'];
        })->values();

        return $leaderboard;
    }

    /**
     * @return array<string, int>
     */
    public function getLateTrend(CarbonImmutable $dateFrom, CarbonImmutable $dateTo, ?int $companyId, ?string $workGroup = null): array
    {
        $query = AttendanceDay::query()
            ->whereBetween('work_date', [$dateFrom->toDateString(), $dateTo->toDateString()])
            ->where('late_minutes', '>', 0);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($workGroup) {
            $query->whereHas('user.group', function ($gq) use ($workGroup) {
                $gq->where('name', $workGroup);
            });
        }

        $recordsMap = $query->selectRaw('DATE(work_date) as date, SUM(late_minutes) as total_late')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total_late', 'date')
            ->all();

        $trend = [];
        $currentDate = $dateFrom;
        while ($currentDate->lte($dateTo)) {
            $dateString = $currentDate->toDateString();
            $trend[$dateString] = (int) ($recordsMap[$dateString] ?? 0);
            $currentDate = $currentDate->addDay();
        }

        return $trend;
    }
}
