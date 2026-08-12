<?php

namespace App\Http\Resources;

use App\Enums\TicketStatus;
use App\Models\Company;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Attendance\DailyAttendanceSummarizer;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use App\Repositories\Contracts\HolidayRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class PublicDashboardPageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var \Closure $usersClosure */
        $usersClosure = $this->resource['users'];
        /** @var CarbonImmutable $attendanceDate */
        $attendanceDate = $this->resource['attendanceDate'];
        /** @var CarbonImmutable $today */
        $today = $this->resource['today'];
        /** @var ShiftAssignmentResolver $shiftResolver */
        $shiftResolver = $this->resource['shiftResolver'];
        /** @var \Closure $ticketsClosure */
        $ticketsClosure = $this->resource['tickets'];
        /** @var \Closure $engineersClosure */
        $engineersClosure = $this->resource['engineers'];
        /** @var \Closure $ticketStatsClosure */
        $ticketStatsClosure = $this->resource['ticketStats'];
        /** @var \Closure $kpiStatsClosure */
        $kpiStatsClosure = $this->resource['kpiStats'];
        /** @var \Closure $analyticsClosure */
        $analyticsClosure = $this->resource['analytics'] ?? fn() => null;
        /** @var \Illuminate\Database\Eloquent\Collection<int, Company> $companies */
        $companies = $this->resource['companies'];
        /** @var array{company_id: int|null, date_from: string, date_to: string} $filters */
        $filters = $this->resource['filters'];

        $dateFrom = CarbonImmutable::parse($filters['date_from']);
        $dateTo = CarbonImmutable::parse($filters['date_to']);

        return [
            'date' => $dateFrom->eq($dateTo)
                ? $dateFrom->locale('en')->translatedFormat('l, d F Y')
                : $dateFrom->locale('en')->translatedFormat('d M Y').' – '.$dateTo->locale('en')->translatedFormat('d M Y'),
            'holiday_name' => app(HolidayRepositoryInterface::class)->getHolidayName($dateTo->toDateString()),
            'attendance' => Inertia::defer(function () use ($usersClosure, $dateFrom, $attendanceDate, $shiftResolver) {
                $users = $usersClosure();
                  $attendance = (new DailyAttendanceSummarizer())->summarize($users, $dateFrom, $attendanceDate, $shiftResolver);
                return [
                    'stats' => $attendance['stats'],
                    'employees' => $attendance['employees'],
                ];
            }),
            'ticket_stats' => Inertia::defer(fn() => $ticketStatsClosure()),
            'kpi_stats' => Inertia::defer(function () use ($kpiStatsClosure) {
                $stats = $kpiStatsClosure();
                
                // Format times for display
                if ($stats['current']['avg_response_seconds'] !== null) {
                    $stats['current']['avg_response_label'] = $this->formatDuration($stats['current']['avg_response_seconds']);
                } else {
                    $stats['current']['avg_response_label'] = null;
                }

                if ($stats['current']['avg_resolution_hours'] !== null) {
                    $stats['current']['avg_resolution_label'] = $this->formatHours($stats['current']['avg_resolution_hours']);
                } else {
                    $stats['current']['avg_resolution_label'] = null;
                }

                return $stats;
            }),
            'initiatives' => Inertia::defer(function () {
                $closure = $this->resource['initiatives'] ?? fn() => collect([]);
                return $closure()->map(fn ($item) => [
                    'id' => $item->id,
                    'sharepoint_item_id' => $item->sharepoint_item_id,
                    'type' => $item->type,
                    'title' => $item->title,
                    'pic' => $item->submitted_by ?? $item->pic,
                    'submitted_by' => $item->submitted_by ?? $item->pic,
                    'status' => $item->initiative_status,
                    'target_timeline' => $item->target_timeline,
                    'impact_level' => $item->impact_level,
                    'data' => $item->data,
                    'last_synced_at' => $item->last_synced_at?->toIso8601String(),
                ])->values()->all();
            }),
            'analytics' => Inertia::defer(fn() => $analyticsClosure()),
            'companies' => $companies->map(fn ($company) => [
                'id' => $company->id,
                'name' => $company->name,
            ])->values()->all(),
            'workGroups' => is_callable($this->resource['workGroups']) ? $this->resource['workGroups']() : $this->resource['workGroups'],
            'filters' => $filters,
            'engineers' => Inertia::defer(function () use ($engineersClosure) {
                return $engineersClosure()
                    ->map(fn (array $engineer) => $this->transformEngineer($engineer))
                    ->all();
            }),
            'tickets' => Inertia::defer(function () use ($ticketsClosure) {
                $tickets = $ticketsClosure();
                return [
                    'data' => collect($tickets->items())
                        ->map(fn (Ticket $ticket) => $this->transformTicket($ticket))
                        ->all(),
                    'meta' => [
                        'current_page' => $tickets->currentPage(),
                        'last_page' => $tickets->lastPage(),
                        'per_page' => $tickets->perPage(),
                        'total' => $tickets->total(),
                        'from' => $tickets->firstItem(),
                        'to' => $tickets->lastItem(),
                    ],
                    'links' => $tickets->linkCollection()->toArray(),
                ];
            }),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function transformTicket(Ticket $ticket): array
    {
        return [
            'id' => $ticket->id,
            'ticket_no' => $ticket->ticket_no,
            'title' => $ticket->title,
            'category' => $ticket->category,
            'status' => $ticket->status?->value,
            'status_label' => $ticket->status ? $this->statusLabel($ticket->status) : null,
            'assigned_to_name' => $ticket->assigned_to_name,
            'assigned_user' => $ticket->assignedUser ? [
                'id' => $ticket->assignedUser->id,
                'name' => $ticket->assignedUser->name,
            ] : null,
            'requested_for' => $ticket->requested_for,
            'created_date' => $ticket->api_creation_date?->toDateString()
                ?? $ticket->first_seen_at?->toDateString(),
            'completed_date' => $ticket->completed_date?->toDateString(),
            'response_time_label' => $ticket->response_time_seconds !== null
                ? $this->formatDuration($ticket->response_time_seconds)
                : null,
            'resolution_time_label' => $ticket->resolution_time !== null && is_numeric($ticket->resolution_time)
                ? $this->formatHours((float) $ticket->resolution_time)
                : null,
            'updated_at' => optional($ticket->status_changed_at ?? $ticket->last_synced_at)
                ? Carbon::parse($ticket->status_changed_at ?? $ticket->last_synced_at)->toIso8601String()
                : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $engineer
     * @return array<string, mixed>
     */
    protected function transformEngineer(array $engineer): array
    {
        $avgResponseSeconds = $engineer['avg_response_time_seconds'] ?? null;
        $avgResolutionHours = $engineer['avg_resolution_time_hours'] ?? null;

        return [
            ...$engineer,
            'avg_response_time_label' => $avgResponseSeconds !== null
                ? $this->formatDuration($avgResponseSeconds)
                : null,
            'avg_resolution_time_label' => $avgResolutionHours !== null
                ? $this->formatHours((float) $avgResolutionHours)
                : null,
        ];
    }

    protected function statusLabel(TicketStatus $status): string
    {
        return match ($status) {
            TicketStatus::Assigned => 'Assigned',
            TicketStatus::PendingOnHold => 'Pending/On Hold',
            TicketStatus::InProgress => 'In Progress',
            TicketStatus::Closed => 'Closed',
        };
    }

    protected function formatHours(float $hours): string
    {
        if ($hours < 1) {
            return round($hours * 60).' min';
        }

        if ($hours < 24) {
            $wholeHours = (int) floor($hours);
            $minutes = (int) round(($hours - $wholeHours) * 60);

            return $minutes > 0 ? "{$wholeHours}h {$minutes}m" : "{$wholeHours}h";
        }

        $days = (int) floor($hours / 24);
        $restHours = (int) round($hours - ($days * 24));

        return $restHours > 0 ? "{$days}d {$restHours}h" : "{$days}d";
    }

    protected function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return $seconds.'s';
        }

        $minutes = intdiv($seconds, 60);

        if ($minutes < 60) {
            return $minutes.' min';
        }

        $hours = intdiv($minutes, 60);
        $restMinutes = $minutes % 60;

        if ($hours < 24) {
            return $restMinutes > 0 ? "{$hours}h {$restMinutes}m" : "{$hours}h";
        }

        $days = intdiv($hours, 24);
        $restHours = $hours % 24;

        return $restHours > 0 ? "{$days}d {$restHours}h" : "{$days}d";
    }
}
