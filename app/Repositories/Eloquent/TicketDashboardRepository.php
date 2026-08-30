<?php

namespace App\Repositories\Eloquent;

use App\Enums\TicketStatus;
use App\Models\Group;
use App\Models\SharePointData;
use App\Models\Ticket;
use App\Models\User;
use App\Repositories\Contracts\SettingRepositoryInterface;
use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use App\Services\Analytics\TicketTrendAnalyzer;
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
        ?string $workGroup = null,
    ): LengthAwarePaginator {
        $query = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId, $workGroup)
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
        ?string $workGroup = null,
    ): Collection {
        /** @var Collection<int, User> $engineers */
        $engineers = User::query()
            ->where('is_active', true)
            ->where('employee_id', 'like', 'Z%')
            ->when($companyId, fn (Builder $query) => $query->where('company_id', $companyId))
            ->when($workGroup, function ($q) use ($workGroup) {
                $q->whereHas('group', function ($gq) use ($workGroup) {
                    $gq->where('name', $workGroup);
                });
            })
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        $statusCounts = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId, $workGroup)
            ->whereNotNull('assigned_to_user_id')
            ->selectRaw('assigned_to_user_id, status as status_value, COUNT(*) as total')
            ->groupBy('assigned_to_user_id', 'status')
            ->get()
            ->groupBy('assigned_to_user_id');

        $responseAvgs = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId, $workGroup)
            ->whereNotNull('assigned_to_user_id')
            ->where('status', '!=', TicketStatus::Assigned->value)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw('assigned_to_user_id, AVG(CASE WHEN response_time_seconds IS NULL OR response_time_seconds <= 0 THEN 60 ELSE response_time_seconds END) as avg_seconds')
            ->groupBy('assigned_to_user_id')
            ->pluck('avg_seconds', 'assigned_to_user_id');

        $resolutionAvgs = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId, $workGroup)
            ->whereNotNull('assigned_to_user_id')
            ->where('status', TicketStatus::Closed->value)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw('assigned_to_user_id, AVG(CASE WHEN resolution_time IS NULL OR CAST(resolution_time AS DECIMAL(10,2)) <= 0 THEN (1.0/60.0) ELSE CAST(resolution_time AS DECIMAL(10,2)) END) as avg_hours')
            ->groupBy('assigned_to_user_id')
            ->pluck('avg_hours', 'assigned_to_user_id');

        $settings = app(\App\Repositories\Contracts\SettingRepositoryInterface::class);
        $resolutionSlaHours = ((int) $settings->get('sla_resolution_time_green', 120)) / 60;

        $resolutionSlaStats = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId, $workGroup)
            ->whereNotNull('assigned_to_user_id')
            ->where('status', TicketStatus::Closed->value)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw('assigned_to_user_id, COUNT(*) as total_standard_closed, SUM(CASE WHEN (CASE WHEN resolution_time IS NULL OR CAST(resolution_time AS DECIMAL(10,2)) <= 0 THEN (1.0/60.0) ELSE CAST(resolution_time AS DECIMAL(10,2)) END) <= ? THEN 1 ELSE 0 END) as met_sla', [$resolutionSlaHours])
            ->groupBy('assigned_to_user_id')
            ->get()
            ->keyBy('assigned_to_user_id');

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

        $monthlyTrendRaw = Ticket::query()
            ->whereNull('disappeared_at')
            ->whereNotNull('assigned_to_user_id')
            ->where('status', TicketStatus::Closed->value)
            ->whereBetween('completed_date', [$dateFrom->startOfDay(), $dateTo->endOfDay()])
            ->when($companyId, function ($query) use ($companyId) {
                $query->whereHas('assignedUser', fn ($q) => $q->where('company_id', $companyId));
            })
            ->when($workGroup, function ($query) use ($workGroup) {
                $query->whereHas('assignedUser.group', function ($gq) use ($workGroup) {
                    $gq->where('name', $workGroup);
                });
            })
            ->selectRaw('assigned_to_user_id, YEAR(completed_date) as yr, MONTH(completed_date) as mo, COUNT(*) as total')
            ->groupBy('assigned_to_user_id', 'yr', 'mo')
            ->get();
            
        $trendByEngineer = $monthlyTrendRaw->groupBy('assigned_to_user_id');

        $lastMonths = [];
        $currentMonth = $dateFrom->startOfMonth();
        $endMonth = $dateTo->endOfMonth();
        
        // Prevent infinite loops or massive arrays if date range is somehow huge
        $maxMonths = 60; 
        $count = 0;
        
        while ($currentMonth->lte($endMonth) && $count < $maxMonths) {
            $lastMonths[] = [
                'month_str' => $currentMonth->format('M Y'),
                'mo' => (int) $currentMonth->format('n'),
                'yr' => (int) $currentMonth->format('Y'),
            ];
            $currentMonth = $currentMonth->addMonth();
            $count++;
        }

        $allInitiatives = SharePointData::ofType('initiative')
            ->get()
            ->filter(function (SharePointData $init) use ($dateFrom, $dateTo) {
                $dateStr = $init->getField('SubmissionDate') ?? $init->getField('Created') ?? $init->getField('Modified');
                if (!$dateStr) {
                    return true;
                }
                try {
                    $initDate = \Carbon\Carbon::parse($dateStr);
                    return $initDate->between($dateFrom->startOfDay(), $dateTo->endOfDay());
                } catch (\Exception $e) {
                    return true;
                }
            })
            ->values();

        $namesMatch = function (?string $strA, ?string $strB): bool {
            if (!$strA || !$strB) {
                return false;
            }

            $normA = preg_replace('/[^\p{L}\p{N}]+/u', ' ', strtolower(trim($strA)));
            $normB = preg_replace('/[^\p{L}\p{N}]+/u', ' ', strtolower(trim($strB)));
            $normA = trim(preg_replace('/\s+/', ' ', (string) $normA));
            $normB = trim(preg_replace('/\s+/', ' ', (string) $normB));

            if ($normA === '' || $normB === '') {
                return false;
            }

            if (str_contains($normA, $normB) || str_contains($normB, $normA)) {
                return true;
            }

            $primaryA = trim(preg_split('/[\(\,]/', $strA)[0] ?? '');
            $primaryB = trim(preg_split('/[\(\,]/', $strB)[0] ?? '');
            if (strlen($primaryA) >= 3 && strlen($primaryB) >= 3) {
                if (strcasecmp($primaryA, $primaryB) === 0 || str_contains(strtolower($primaryA), strtolower($primaryB)) || str_contains(strtolower($primaryB), strtolower($primaryA))) {
                    return true;
                }
            }

            $wordsA = array_filter(explode(' ', $normA), fn ($w) => strlen($w) >= 3 && !in_array($w, ['dso', 'dco', 'kpc', 'ext', 'it', 'the', 'and', 'for']));
            $wordsB = array_filter(explode(' ', $normB), fn ($w) => strlen($w) >= 3 && !in_array($w, ['dso', 'dco', 'kpc', 'ext', 'it', 'the', 'and', 'for']));

            if (count($wordsA) > 0 && count($wordsB) > 0) {
                $common = array_intersect($wordsA, $wordsB);
                if (count($common) >= 2 || (count($wordsA) === 1 && count($common) === 1) || (count($wordsB) === 1 && count($common) === 1)) {
                    return true;
                }
            }

            return false;
        };

        $matchInitiativeToEngineer = function (SharePointData $item, User $engineer) use ($namesMatch): bool {
            $name = $engineer->name;
            $empId = $engineer->employee_id ? strtolower(trim($engineer->employee_id)) : null;
            $email = $engineer->email ? strtolower(trim($engineer->email)) : null;

            $checkValue = function ($value) use ($name, $empId, $email, $namesMatch, &$checkValue): bool {
                if ($value === null) {
                    return false;
                }
                if (is_string($value) && trim($value) !== '') {
                    $v = strtolower(trim($value));
                    if ($namesMatch($name, $value)) {
                        return true;
                    }
                    if ($empId && str_contains($v, $empId)) {
                        return true;
                    }
                    if ($email && (str_contains($v, $email) || $namesMatch($email, $value))) {
                        return true;
                    }
                    return false;
                }
                if (is_array($value)) {
                    foreach ($value as $val) {
                        if ($checkValue($val)) {
                            return true;
                        }
                    }
                }
                return false;
            };

            if ($checkValue($item->submitted_by)) {
                return true;
            }

            $personKeys = [
                'SubmittedBy', 'Submitted By', 'Author', 'CreatedBy'
            ];
            foreach ($personKeys as $key) {
                if (isset($item->data[$key]) && $checkValue($item->data[$key])) {
                    return true;
                }
            }

            return false;
        };

        return $engineers->map(function (User $engineer) use ($statusCounts, $responseAvgs, $resolutionAvgs, $resolutionSlaStats, $globalActiveCounts, $allInitiatives, $matchInitiativeToEngineer, $trendByEngineer, $lastMonths) {
            $byStatus = ($statusCounts[$engineer->id] ?? collect())->pluck('total', 'status_value');

            $assigned = (int) ($byStatus[TicketStatus::Assigned->value] ?? 0);
            $pending = (int) ($byStatus[TicketStatus::PendingOnHold->value] ?? 0);
            $inProgress = (int) ($byStatus[TicketStatus::InProgress->value] ?? 0);
            $completed = (int) ($byStatus[TicketStatus::Closed->value] ?? 0);

            $avgResponse = $responseAvgs[$engineer->id] ?? null;
            $avgResolution = $resolutionAvgs[$engineer->id] ?? null;

            $engineerInitiatives = $allInitiatives
                ->filter(fn (SharePointData $init) => $matchInitiativeToEngineer($init, $engineer))
                ->values();

            return [
                'id' => $engineer->id,
                'name' => $engineer->name,
                'employee_id' => $engineer->employee_id,
                'assigned' => $assigned,
                'pending' => $pending,
                'in_progress' => $inProgress,
                'completed_today' => $completed,
                'met_resolution_sla' => (int) ($resolutionSlaStats[$engineer->id]->met_sla ?? 0),
                'total_standard_closed' => (int) ($resolutionSlaStats[$engineer->id]->total_standard_closed ?? 0),
                'total' => $assigned + $pending + $inProgress + $completed,
                'global_active_tickets' => (int) ($globalActiveCounts[$engineer->id] ?? 0),
                'avg_response_time_seconds' => $avgResponse !== null ? (int) round((float) $avgResponse) : null,
                'avg_resolution_time_hours' => $avgResolution !== null ? round((float) $avgResolution, 2) : null,
                'initiative_count' => $engineerInitiatives->count(),
                'initiatives' => $engineerInitiatives->map(function (SharePointData $init) {
                    return [
                        'id' => $init->id,
                        'title' => $init->title,
                        'status' => $init->initiative_status,
                        'impact_level' => $init->impact_level,
                        'target_timeline' => $init->target_timeline,
                        'pic' => $init->pic,
                    ];
                })->toArray(),
                'monthly_trend' => collect($lastMonths)->map(function ($m) use ($engineer, $trendByEngineer) {
                    $rawTrend = $trendByEngineer[$engineer->id] ?? collect();
                    $match = $rawTrend->first(fn($t) => $t->mo === $m['mo'] && $t->yr === $m['yr']);
                    return [
                        'month' => $m['month_str'],
                        'tickets' => $match ? (int) $match->total : 0,
                    ];
                })->toArray(),
            ];
        })->values();
    }

    public function globalStats(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
        ?string $workGroup = null,
    ): array {
        $byStatus = $this->scopedTicketQuery($dateFrom, $dateTo, $companyId, $workGroup)
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
        ?string $workGroup = null,
    ): Builder {
        return Ticket::query()
            ->whereNull('disappeared_at')
            ->when($companyId, function (Builder $query) use ($companyId) {
                $query->whereHas('assignedUser', fn (Builder $userQuery) => $userQuery->where('company_id', $companyId));
            })
            ->when($workGroup, function (Builder $query) use ($workGroup) {
                $query->whereHas('assignedUser.group', function (Builder $gq) use ($workGroup) {
                    $gq->where('name', $workGroup);
                });
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
        ?string $workGroup = null,
    ): array {
        $settings = app(SettingRepositoryInterface::class);
        $responseSlaSeconds ??= ((int) $settings->get('sla_response_time_green', 60)) * 60;
        $resolutionSlaHours ??= ((int) $settings->get('sla_resolution_time_green', 120)) / 60;
        $calculateForPeriod = function (CarbonImmutable $start, CarbonImmutable $end) use ($companyId, $workGroup, $responseSlaSeconds, $resolutionSlaHours) {
            $baseQuery = $this->scopedTicketQuery($start, $end, $companyId, $workGroup);

            // Response SLA
            $responseStats = (clone $baseQuery)
                ->where('status', '!=', TicketStatus::Assigned->value)
                ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
                ->selectRaw('
                    COUNT(*) as total_responded,
                    SUM(CASE WHEN (CASE WHEN response_time_seconds IS NULL OR response_time_seconds <= 0 THEN 60 ELSE response_time_seconds END) <= ? THEN 1 ELSE 0 END) as met_response_sla,
                    AVG(CASE WHEN response_time_seconds IS NULL OR response_time_seconds <= 0 THEN 60 ELSE response_time_seconds END) as avg_response_seconds
                ', [$responseSlaSeconds])
                ->first();

            // Resolution SLA
            $resolutionStats = (clone $baseQuery)
                ->where('status', TicketStatus::Closed->value)
                ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
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
        ?int $limit = 10,
        ?string $workGroup = null,
    ): array {
        $getFormattedItems = function ($dFrom, $dTo) use ($companyId, $workGroup) {
            $predictions = $this->scopedTicketQuery($dFrom, $dTo, $companyId, $workGroup)
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

        $analyzer = new TicketTrendAnalyzer();
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
        ?string $workGroup = null,
    ): array {
        return $this->scopedTicketQuery($dateFrom, $dateTo, $companyId, $workGroup)
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

    public function getSlaTrend(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
        ?string $workGroup = null,
    ): array {
        $refDate = $dateTo;

        $settings = app(SettingRepositoryInterface::class);
        $responseSlaHours = round(((int) $settings->get('sla_response_time_green', 60)) / 60.0, 2);
        $resolutionSlaHours = round(((int) $settings->get('sla_resolution_time_green', 120)) / 60.0, 2);

        $resExpr = '(CASE WHEN resolution_time IS NULL OR CAST(resolution_time AS DECIMAL(10,2)) <= 0 THEN (1.0/60.0) ELSE CAST(resolution_time AS DECIMAL(10,2)) END)';
        $respExpr = '((CASE WHEN response_time_seconds IS NULL OR response_time_seconds <= 0 THEN 60 ELSE response_time_seconds END) / 3600.0)';

        // 1. WEEK MODE (7 Hari Terakhir -> Harian)
        $weekStart = $refDate->subDays(6);
        $weekResByDate = $this->scopedTicketQuery($weekStart, $refDate, $companyId, $workGroup)
            ->where('status', TicketStatus::Closed->value)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                DATE(COALESCE(api_creation_date, first_seen_at, status_changed_at)) as dt,
                AVG({$resExpr}) as avg_res
            ")
            ->groupBy('dt')
            ->pluck('avg_res', 'dt');

        $weekRespByDate = $this->scopedTicketQuery($weekStart, $refDate, $companyId, $workGroup)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                DATE(COALESCE(api_creation_date, first_seen_at, status_changed_at)) as dt,
                AVG({$respExpr} * 3600.0) as avg_resp
            ")
            ->groupBy('dt')
            ->pluck('avg_resp', 'dt');

        $weekCountsByDate = $this->scopedTicketQuery($weekStart, $refDate, $companyId, $workGroup)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                DATE(COALESCE(api_creation_date, first_seen_at, status_changed_at)) as dt,
                SUM(CASE WHEN status = 'closed' AND {$resExpr} <= ? AND {$respExpr} <= ? THEN 1 ELSE 0 END) as met_count,
                SUM(CASE WHEN status = 'closed' AND {$respExpr} > ? AND {$resExpr} <= ? THEN 1 ELSE 0 END) as breached_resp,
                SUM(CASE WHEN status = 'closed' AND {$resExpr} > ? THEN 1 ELSE 0 END) as breached_res,
                SUM(CASE WHEN status != 'closed' OR status IS NULL THEN 1 ELSE 0 END) as unresolved_count
            ", [$resolutionSlaHours, $responseSlaHours, $responseSlaHours, $resolutionSlaHours, $resolutionSlaHours])
            ->groupBy('dt')
            ->get()
            ->keyBy('dt');

        $weekLabels = [];
        $weekResolution = [];
        $weekResponse = [];
        $weekMetSla = [];
        $weekBreachedRes = [];
        $weekBreachedResp = [];
        $weekUnresolved = [];
        $curr = $weekStart->copy();
        while ($curr->lte($refDate)) {
            $ds = $curr->toDateString();
            $row = $weekCountsByDate->get($ds);
            $weekLabels[] = $curr->translatedFormat('d M');
            $weekResolution[] = round((float) ($weekResByDate[$ds] ?? 0), 2);
            $weekResponse[] = round(((float) ($weekRespByDate[$ds] ?? 0)) / 3600.0, 2);
            $weekMetSla[] = (int) ($row->met_count ?? 0);
            $weekBreachedRes[] = (int) ($row->breached_res ?? 0);
            $weekBreachedResp[] = (int) ($row->breached_resp ?? 0);
            $weekUnresolved[] = (int) ($row->unresolved_count ?? 0);
            $curr = $curr->addDay();
        }

        // 2. MONTH MODE (Bulan Terpilih -> Mingguan)
        $monthStart = $refDate->startOfMonth();
        $monthEnd = $refDate->endOfMonth();

        $monthResByWeek = $this->scopedTicketQuery($monthStart, $monthEnd, $companyId, $workGroup)
            ->where('status', TicketStatus::Closed->value)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                (FLOOR((DAY(COALESCE(api_creation_date, first_seen_at, status_changed_at)) - 1) / 7) + 1) as wk,
                AVG({$resExpr}) as avg_res
            ")
            ->groupBy('wk')
            ->pluck('avg_res', 'wk');

        $monthRespByWeek = $this->scopedTicketQuery($monthStart, $monthEnd, $companyId, $workGroup)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                (FLOOR((DAY(COALESCE(api_creation_date, first_seen_at, status_changed_at)) - 1) / 7) + 1) as wk,
                AVG({$respExpr} * 3600.0) as avg_resp
            ")
            ->groupBy('wk')
            ->pluck('avg_resp', 'wk');

        $monthCountsByWeek = $this->scopedTicketQuery($monthStart, $monthEnd, $companyId, $workGroup)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                (FLOOR((DAY(COALESCE(api_creation_date, first_seen_at, status_changed_at)) - 1) / 7) + 1) as wk,
                SUM(CASE WHEN status = 'closed' AND {$resExpr} <= ? AND {$respExpr} <= ? THEN 1 ELSE 0 END) as met_count,
                SUM(CASE WHEN status = 'closed' AND {$respExpr} > ? AND {$resExpr} <= ? THEN 1 ELSE 0 END) as breached_resp,
                SUM(CASE WHEN status = 'closed' AND {$resExpr} > ? THEN 1 ELSE 0 END) as breached_res,
                SUM(CASE WHEN status != 'closed' OR status IS NULL THEN 1 ELSE 0 END) as unresolved_count
            ", [$resolutionSlaHours, $responseSlaHours, $responseSlaHours, $resolutionSlaHours, $resolutionSlaHours])
            ->groupBy('wk')
            ->get()
            ->keyBy('wk');

        $monthLabels = [];
        $monthResolution = [];
        $monthResponse = [];
        $monthMetSla = [];
        $monthBreachedRes = [];
        $monthBreachedResp = [];
        $monthUnresolved = [];
        for ($w = 1; $w <= 5; $w++) {
            $row = $monthCountsByWeek->get($w) ?? $monthCountsByWeek->get((string)$w);
            $monthLabels[] = "Week {$w}";
            $monthResolution[] = round((float) ($monthResByWeek[$w] ?? $monthResByWeek[(string)$w] ?? 0), 2);
            $monthResponse[] = round(((float) ($monthRespByWeek[$w] ?? $monthRespByWeek[(string)$w] ?? 0)) / 3600.0, 2);
            $monthMetSla[] = (int) ($row->met_count ?? 0);
            $monthBreachedRes[] = (int) ($row->breached_res ?? 0);
            $monthBreachedResp[] = (int) ($row->breached_resp ?? 0);
            $monthUnresolved[] = (int) ($row->unresolved_count ?? 0);
        }

        // 3. YEAR MODE (Tahun Terpilih -> Bulanan)
        $yearStart = $refDate->startOfYear();
        $yearEnd = $refDate->endOfYear();

        $yearResByMonth = $this->scopedTicketQuery($yearStart, $yearEnd, $companyId, $workGroup)
            ->where('status', TicketStatus::Closed->value)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                MONTH(COALESCE(api_creation_date, first_seen_at, status_changed_at)) as mn,
                AVG({$resExpr}) as avg_res
            ")
            ->groupBy('mn')
            ->pluck('avg_res', 'mn');

        $yearRespByMonth = $this->scopedTicketQuery($yearStart, $yearEnd, $companyId, $workGroup)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                MONTH(COALESCE(api_creation_date, first_seen_at, status_changed_at)) as mn,
                AVG({$respExpr} * 3600.0) as avg_resp
            ")
            ->groupBy('mn')
            ->pluck('avg_resp', 'mn');

        $yearCountsByMonth = $this->scopedTicketQuery($yearStart, $yearEnd, $companyId, $workGroup)
            ->whereRaw("ticket_no REGEXP '^[0-9]+$'")
            ->selectRaw("
                MONTH(COALESCE(api_creation_date, first_seen_at, status_changed_at)) as mn,
                SUM(CASE WHEN status = 'closed' AND {$resExpr} <= ? AND {$respExpr} <= ? THEN 1 ELSE 0 END) as met_count,
                SUM(CASE WHEN status = 'closed' AND {$respExpr} > ? AND {$resExpr} <= ? THEN 1 ELSE 0 END) as breached_resp,
                SUM(CASE WHEN status = 'closed' AND {$resExpr} > ? THEN 1 ELSE 0 END) as breached_res,
                SUM(CASE WHEN status != 'closed' OR status IS NULL THEN 1 ELSE 0 END) as unresolved_count
            ", [$resolutionSlaHours, $responseSlaHours, $responseSlaHours, $resolutionSlaHours, $resolutionSlaHours])
            ->groupBy('mn')
            ->get()
            ->keyBy('mn');

        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $yearLabels = [];
        $yearResolution = [];
        $yearResponse = [];
        $yearMetSla = [];
        $yearBreachedRes = [];
        $yearBreachedResp = [];
        $yearUnresolved = [];
        for ($m = 1; $m <= 12; $m++) {
            $row = $yearCountsByMonth->get($m) ?? $yearCountsByMonth->get((string)$m);
            $yearLabels[] = $monthNames[$m - 1];
            $yearResolution[] = round((float) ($yearResByMonth[$m] ?? $yearResByMonth[(string)$m] ?? 0), 2);
            $yearResponse[] = round(((float) ($yearRespByMonth[$m] ?? $yearRespByMonth[(string)$m] ?? 0)) / 3600.0, 2);
            $yearMetSla[] = (int) ($row->met_count ?? 0);
            $yearBreachedRes[] = (int) ($row->breached_res ?? 0);
            $yearBreachedResp[] = (int) ($row->breached_resp ?? 0);
            $yearUnresolved[] = (int) ($row->unresolved_count ?? 0);
        }

        return [
            'week' => [
                'labels' => $weekLabels,
                'resolutionValues' => $weekResolution,
                'responseValues' => $weekResponse,
                'metSlaCount' => $weekMetSla,
                'breachedResolutionCount' => $weekBreachedRes,
                'breachedResponseCount' => $weekBreachedResp,
                'unresolvedCount' => $weekUnresolved,
            ],
            'month' => [
                'labels' => $monthLabels,
                'resolutionValues' => $monthResolution,
                'responseValues' => $monthResponse,
                'metSlaCount' => $monthMetSla,
                'breachedResolutionCount' => $monthBreachedRes,
                'breachedResponseCount' => $monthBreachedResp,
                'unresolvedCount' => $monthUnresolved,
            ],
            'year' => [
                'labels' => $yearLabels,
                'resolutionValues' => $yearResolution,
                'responseValues' => $yearResponse,
                'metSlaCount' => $yearMetSla,
                'breachedResolutionCount' => $yearBreachedRes,
                'breachedResponseCount' => $yearBreachedResp,
                'unresolvedCount' => $yearUnresolved,
            ],
            'thresholds' => [
                'response_sla_hours' => $responseSlaHours,
                'resolution_sla_hours' => $resolutionSlaHours,
            ],
        ];
    }

    public function getAvailableWorkGroups(): array
    {
        return Group::query()
            ->orderBy('name')
            ->pluck('name')
            ->toArray();
    }
}
