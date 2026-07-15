<?php

namespace App\Repositories\Eloquent;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class TicketDashboardRepository implements TicketDashboardRepositoryInterface
{
    private const TICKET_DATE_EXPRESSION = 'DATE(COALESCE(api_creation_date, first_seen_at, status_changed_at))';

    public function paginateLatest(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
        int $perPage = 10,
        ?string $search = null,
        ?string $sortBy = null,
        ?string $sortDir = 'desc',
        ?string $status = null,
    ): LengthAwarePaginator {
        $query = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId)
            ->with('assignedUser:id,name,employee_id');

        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('ticket_no', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('assigned_to_name', 'like', "%{$search}%")
                  ->orWhereHas('assignedUser', function (Builder $uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('aiPrediction', function (Builder $aq) use ($search) {
                      $aq->where('cluster_label', 'like', "%{$search}%")
                         ->orWhere('sub_cluster_label', 'like', "%{$search}%");
                  });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $direction = strtolower($sortDir) === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'created_date') {
            $query->orderBy('api_creation_date', $direction);
        } elseif ($sortBy === 'response_time') {
            $query->orderBy('response_time_seconds', $direction);
        } elseif ($sortBy === 'resolution_time') {
            $query->orderByRaw("CAST(resolution_time AS DECIMAL(10,2)) {$direction}");
        } else {
            // Default sort
            $query->orderByRaw('COALESCE(completed_date, status_changed_at, first_seen_at, api_creation_date) DESC')
                  ->orderByDesc('id');
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function engineerSummaries(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
    ): Collection {
        /** @var Collection<int, User> $engineers */
        $engineers = User::query()
            ->where('is_active', true)
            ->where('employee_id', 'like', 'Z%')
            ->when($companyId, fn (Builder $query) => $query->where('company_id', $companyId))
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        $statusCounts = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId)
            ->whereNotNull('assigned_to_user_id')
            ->selectRaw('assigned_to_user_id, status as status_value, COUNT(*) as total')
            ->groupBy('assigned_to_user_id', 'status')
            ->get()
            ->groupBy('assigned_to_user_id');

        $responseAvgs = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId)
            ->whereNotNull('assigned_to_user_id')
            ->where('status', '!=', TicketStatus::Assigned->value)
            ->selectRaw('assigned_to_user_id, AVG(CASE WHEN response_time_seconds IS NULL OR response_time_seconds <= 0 THEN 60 ELSE response_time_seconds END) as avg_seconds')
            ->groupBy('assigned_to_user_id')
            ->pluck('avg_seconds', 'assigned_to_user_id');

        $resolutionAvgs = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId)
            ->whereNotNull('assigned_to_user_id')
            ->where('status', TicketStatus::Closed->value)
            ->selectRaw('assigned_to_user_id, AVG(CASE WHEN resolution_time IS NULL OR CAST(resolution_time AS DECIMAL(10,2)) <= 0 THEN (1.0/60.0) ELSE CAST(resolution_time AS DECIMAL(10,2)) END) as avg_hours')
            ->groupBy('assigned_to_user_id')
            ->pluck('avg_hours', 'assigned_to_user_id');

        $globalActiveCounts = Ticket::query()
            ->whereNull('disappeared_at')
            ->whereNotNull('assigned_to_user_id')
            ->whereIn('status', [TicketStatus::Assigned->value, TicketStatus::InProgress->value, TicketStatus::PendingOnHold->value])
            ->when($companyId, function (Builder $query) use ($companyId) {
                $query->whereHas('assignedUser', fn (Builder $userQuery) => $userQuery->where('company_id', $companyId));
            })
            ->selectRaw('assigned_to_user_id, COUNT(*) as total')
            ->groupBy('assigned_to_user_id')
            ->pluck('total', 'assigned_to_user_id');

        return $engineers->map(function (User $engineer) use ($statusCounts, $responseAvgs, $resolutionAvgs, $globalActiveCounts) {
            $byStatus = ($statusCounts[$engineer->id] ?? collect())->pluck('total', 'status_value');

            $assigned = (int) ($byStatus[TicketStatus::Assigned->value] ?? 0);
            $pending = (int) ($byStatus[TicketStatus::PendingOnHold->value] ?? 0);
            $inProgress = (int) ($byStatus[TicketStatus::InProgress->value] ?? 0);
            $completed = (int) ($byStatus[TicketStatus::Closed->value] ?? 0);

            $avgResponse = $responseAvgs[$engineer->id] ?? null;
            $avgResolution = $resolutionAvgs[$engineer->id] ?? null;

            return [
                'id' => $engineer->id,
                'name' => $engineer->name,
                'employee_id' => $engineer->employee_id,
                'assigned' => $assigned,
                'pending' => $pending,
                'in_progress' => $inProgress,
                'completed_today' => $completed,
                'total' => $assigned + $pending + $inProgress + $completed,
                'global_active_tickets' => (int) ($globalActiveCounts[$engineer->id] ?? 0),
                'avg_response_time_seconds' => $avgResponse !== null ? (int) round((float) $avgResponse) : null,
                'avg_resolution_time_hours' => $avgResolution !== null ? round((float) $avgResolution, 2) : null,
            ];
        })->values();
    }

    public function globalStats(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
    ): array {
        $byStatus = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId)
            ->selectRaw('status as status_value, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status_value');

        $assigned = (int) ($byStatus[TicketStatus::Assigned->value] ?? 0);
        $pending = (int) ($byStatus[TicketStatus::PendingOnHold->value] ?? 0);
        $inProgress = (int) ($byStatus[TicketStatus::InProgress->value] ?? 0);
        $completed = (int) ($byStatus[TicketStatus::Closed->value] ?? 0);

        return [
            'assigned' => $assigned,
            'pending' => $pending,
            'in_progress' => $inProgress,
            'open_total' => $assigned + $pending + $inProgress,
            'completed_today' => $completed,
            'created_today' => $assigned + $pending + $inProgress + $completed,
        ];
    }

    /**
     * @return Builder<Ticket>
     */
    private function scopedTicketQuery(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId,
    ): Builder {
        return Ticket::query()
            ->whereNull('disappeared_at')
            ->when($companyId, function (Builder $query) use ($companyId) {
                $query->whereHas('assignedUser', fn (Builder $userQuery) => $userQuery->where('company_id', $companyId));
            })
            ->whereRaw(self::TICKET_DATE_EXPRESSION.' BETWEEN ? AND ?', [
                $dateFrom->toDateString(),
                $dateTo->toDateString(),
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function kpiStats(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
        ?int $responseSlaSeconds = null,
        ?float $resolutionSlaHours = null,
    ): array {
        $settings = app(\App\Repositories\Contracts\SettingRepositoryInterface::class);
        $responseSlaSeconds ??= ((int) $settings->get('sla_response_time_green', 60)) * 60;
        $resolutionSlaHours ??= ((int) $settings->get('sla_resolution_time_green', 120)) / 60;
        $calculateForPeriod = function (CarbonImmutable $start, CarbonImmutable $end) use ($companyId, $responseSlaSeconds, $resolutionSlaHours) {
            $baseQuery = $this->scopedTicketQuery($start, $end, $companyId);

            // Response SLA
            $responseStats = (clone $baseQuery)
                ->where('status', '!=', TicketStatus::Assigned->value)
                ->selectRaw('
                    COUNT(*) as total_responded,
                    SUM(CASE WHEN (CASE WHEN response_time_seconds IS NULL OR response_time_seconds <= 0 THEN 60 ELSE response_time_seconds END) <= ? THEN 1 ELSE 0 END) as met_response_sla,
                    AVG(CASE WHEN response_time_seconds IS NULL OR response_time_seconds <= 0 THEN 60 ELSE response_time_seconds END) as avg_response_seconds
                ', [$responseSlaSeconds])
                ->first();

            // Resolution SLA
            $resolutionStats = (clone $baseQuery)
                ->where('status', TicketStatus::Closed->value)
                ->selectRaw('
                    COUNT(*) as total_resolved,
                    SUM(CASE WHEN (CASE WHEN resolution_time IS NULL OR CAST(resolution_time AS DECIMAL(10,2)) <= 0 THEN (1.0/60.0) ELSE CAST(resolution_time AS DECIMAL(10,2)) END) <= ? THEN 1 ELSE 0 END) as met_resolution_sla,
                    AVG(CASE WHEN resolution_time IS NULL OR CAST(resolution_time AS DECIMAL(10,2)) <= 0 THEN (1.0/60.0) ELSE CAST(resolution_time AS DECIMAL(10,2)) END) as avg_resolution_hours
                ', [$resolutionSlaHours])
                ->first();

            $totalResponded = (int) ($responseStats->total_responded ?? 0);
            $metResponseSla = (int) ($responseStats->met_response_sla ?? 0);
            
            $totalResolved = (int) ($resolutionStats->total_resolved ?? 0);
            $metResolutionSla = (int) ($resolutionStats->met_resolution_sla ?? 0);

            return [
                'response_sla_percent' => $totalResponded > 0 ? round(($metResponseSla / $totalResponded) * 100, 1) : null,
                'resolution_sla_percent' => $totalResolved > 0 ? round(($metResolutionSla / $totalResolved) * 100, 1) : null,
                'avg_response_seconds' => $responseStats->avg_response_seconds ? (float) $responseStats->avg_response_seconds : null,
                'avg_resolution_hours' => $resolutionStats->avg_resolution_hours ? (float) $resolutionStats->avg_resolution_hours : null,
                'total_resolved' => $totalResolved,
            ];
        };

        $current = $calculateForPeriod($dateFrom, $dateTo);

        // Calculate previous period
        $daysDiff = $dateFrom->diffInDays($dateTo);
        $prevDateTo = $dateFrom->subDay();
        $prevDateFrom = $prevDateTo->subDays($daysDiff);
        $previous = $calculateForPeriod($prevDateFrom, $prevDateTo);

        return [
            'current' => $current,
            'previous' => $previous,
            'targets' => [
                'response_sla_seconds' => $responseSlaSeconds,
                'resolution_sla_hours' => $resolutionSlaHours,
            ],
        ];
    }

    /**
     * Get top trending ticket keywords and their trends compared to previous period.
     *
     * @return array
     */
    public function getTrendingKeywords(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
        ?int $limit = 10
    ): array {
        $getFormattedItems = function ($dFrom, $dTo) use ($companyId) {
            $predictions = $this->scopedTicketQuery($dFrom, $dTo, $companyId)
                ->join('ticket_ai_predictions', 'tickets.id', '=', 'ticket_ai_predictions.ticket_id')
                ->whereNotNull('ticket_ai_predictions.cluster_label')
                ->select('ticket_ai_predictions.cluster_label', 'ticket_ai_predictions.sub_cluster_label')
                ->get();
            
            $items = [];
            foreach ($predictions as $p) {
                $mainCategory = trim((string)$p->cluster_label);
                $subCategory = trim((string)$p->sub_cluster_label);
                
                if ($mainCategory && $subCategory && $subCategory !== 'Unknown' && $subCategory !== 'Other') {
                    $items[] = $mainCategory . ' - ' . $subCategory;
                } else {
                    $items[] = $mainCategory ?: "Isu: Umum";
                }
            }
            return $items;
        };

        // Current period tickets
        $currentItems = $getFormattedItems($dateFrom, $dateTo);

        // Calculate previous period
        $daysDiff = $dateFrom->diffInDays($dateTo);
        $prevDateTo = $dateFrom->subDay();
        $prevDateFrom = $prevDateTo->subDays($daysDiff);

        $previousItems = $getFormattedItems($prevDateFrom, $prevDateTo);

        $analyzer = new \App\Services\Analytics\TicketTrendAnalyzer();
        return $analyzer->analyzeKeywords($currentItems, $previousItems, $limit);
    }

    /**
     * Get total tickets grouped by work_group
     *
     * @return array
     */
    public function getTicketsByWorkGroup(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
    ): array {
        return $this->scopedTicketQuery($dateFrom, $dateTo, $companyId)
            ->whereNotNull('work_group')
            ->selectRaw('work_group, COUNT(*) as total')
            ->groupBy('work_group')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->work_group,
                    'total' => (int) $item->total,
                ];
            })
            ->toArray();
    }
}
