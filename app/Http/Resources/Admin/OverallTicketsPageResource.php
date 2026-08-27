<?php

namespace App\Http\Resources\Admin;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;

class OverallTicketsPageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->resource['user'];
        /** @var LengthAwarePaginator $ticketsPaginator */
        $ticketsPaginator = $this->resource['tickets'];
        
        $filters = $this->resource['filters'] ?? [];
        $options = $this->resource['options'] ?? [];

        // We only transform the current page items
        $transformedTickets = collect($ticketsPaginator->items())->map(
            fn (Ticket $ticket) => $this->transformTicket($ticket)
        )->values()->all();

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'employee_id' => $user->employee_id,
            ],
            'tickets' => [
                'data' => $transformedTickets,
                'links' => [
                    'first' => $ticketsPaginator->url(1),
                    'last' => $ticketsPaginator->url($ticketsPaginator->lastPage()),
                    'prev' => $ticketsPaginator->previousPageUrl(),
                    'next' => $ticketsPaginator->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $ticketsPaginator->currentPage(),
                    'from' => $ticketsPaginator->firstItem(),
                    'last_page' => $ticketsPaginator->lastPage(),
                    'links' => $ticketsPaginator->linkCollection()->toArray(),
                    'path' => $ticketsPaginator->path(),
                    'per_page' => $ticketsPaginator->perPage(),
                    'to' => $ticketsPaginator->lastItem(),
                    'total' => $ticketsPaginator->total(),
                ],
            ],
            'filters' => $filters,
            'stats' => $this->resource['stats'] ?? [],
            'options' => $options,
            'status_options' => array_map(
                fn (TicketStatus $case) => [
                    'value' => $case->value,
                    'label' => $this->statusLabel($case),
                ],
                TicketStatus::cases(),
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function transformTicket(Ticket $ticket): array
    {
        $isNonStandard = preg_match('/[a-zA-Z]/', (string) $ticket->ticket_no);

        return [
            'id' => $ticket->id,
            'ticket_no' => $ticket->ticket_no,
            'title' => $ticket->title,
            'category' => $ticket->category,
            'sub_category' => $ticket->sub_category,
            'computer_name' => $ticket->computer_name,
            'requested_for' => $ticket->requested_for,
            'status' => $ticket->status?->value,
            'status_label' => $ticket->status ? $this->statusLabel($ticket->status) : null,
            'work_group' => $ticket->work_group,
            'assigned_user' => $ticket->assignedUser ? [
                'name' => $ticket->assignedUser->name,
                'company' => $ticket->assignedUser->company ? $ticket->assignedUser->company->name : null,
                'group' => $ticket->assignedUser->group ? $ticket->assignedUser->group->name : null,
            ] : null,
            'first_seen_at' => $ticket->first_seen_at?->toIso8601String(),
            'in_progress_at' => $ticket->in_progress_at?->toIso8601String(),
            'status_changed_at' => $ticket->status_changed_at?->toIso8601String(),
            'disappeared_at' => $ticket->disappeared_at?->toIso8601String(),
            'response_time_seconds' => $ticket->response_time_seconds,
            'response_time_label' => ($ticket->response_time_seconds !== null && !$isNonStandard)
                ? $this->formatDuration($ticket->response_time_seconds)
                : '-',
            'api_creation_date' => $ticket->api_creation_date?->toDateString(),
            'completed_date' => $ticket->completed_date?->toDateString(),
            'resolution_time' => $ticket->resolution_time,
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

    protected function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return $seconds.' dtk';
        }

        $minutes = intdiv($seconds, 60);

        if ($minutes < 60) {
            return $minutes.' mnt';
        }

        $hours = intdiv($minutes, 60);
        $restMinutes = $minutes % 60;

        if ($hours < 24) {
            return $restMinutes > 0 ? "{$hours} jam {$restMinutes} mnt" : "{$hours} jam";
        }

        $days = intdiv($hours, 24);
        $restHours = $hours % 24;

        return $restHours > 0 ? "{$days} hari {$restHours} jam" : "{$days} hari";
    }
}
