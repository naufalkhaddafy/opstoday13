<?php

namespace App\Http\Resources;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Attendance\DailyAttendanceSummarizer;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PublicDashboardPageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, User> $users */
        $users = $this->resource['users'];
        /** @var CarbonImmutable $attendanceDate */
        $attendanceDate = $this->resource['attendanceDate'];
        /** @var CarbonImmutable $today */
        $today = $this->resource['today'];
        /** @var ShiftAssignmentResolver $shiftResolver */
        $shiftResolver = $this->resource['shiftResolver'];
        /** @var LengthAwarePaginator $tickets */
        $tickets = $this->resource['tickets'];
        /** @var Collection<int, array<string, mixed>> $engineers */
        $engineers = $this->resource['engineers'];
        /** @var array<string, int> $ticketStats */
        $ticketStats = $this->resource['ticketStats'];
        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Company> $companies */
        $companies = $this->resource['companies'];
        /** @var array{company_id: int|null, date_from: string, date_to: string} $filters */
        $filters = $this->resource['filters'];

        $attendance = (new DailyAttendanceSummarizer())->summarize($users, $attendanceDate, $shiftResolver);

        $dateFrom = CarbonImmutable::parse($filters['date_from']);
        $dateTo = CarbonImmutable::parse($filters['date_to']);

        return [
            'date' => $dateFrom->eq($dateTo)
                ? $dateFrom->locale('en')->translatedFormat('l, d F Y')
                : $dateFrom->locale('en')->translatedFormat('d M Y').' – '.$dateTo->locale('en')->translatedFormat('d M Y'),
            'attendance' => [
                'stats' => $attendance['stats'],
                'employees' => $attendance['employees'],
            ],
            'ticket_stats' => $ticketStats,
            'companies' => $companies->map(fn ($company) => [
                'id' => $company->id,
                'name' => $company->name,
            ])->values()->all(),
            'filters' => $filters,
            'engineers' => $engineers
                ->map(fn (array $engineer) => $this->transformEngineer($engineer))
                ->all(),
            'tickets' => [
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
            ],
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
