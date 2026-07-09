<?php

namespace App\Http\Resources\Admin;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class UserTicketsPageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->resource['user'];
        /** @var Collection<int, Ticket> $tickets */
        $tickets = $this->resource['tickets'];
        $status = $this->resource['status'] ?? null;
        $search = $this->resource['search'] ?? null;
        $month = $this->resource['month'] ?? null;
        $year = $this->resource['year'] ?? null;

        $responseTimes = $tickets
            ->filter(fn ($t) => $t->status !== TicketStatus::Assigned)
            ->map(function ($t) {
                $val = $t->response_time_seconds;
                return ($val === null || $val <= 0) ? 60 : $val;
            });

        $resolutionTimes = $tickets
            ->filter(fn ($t) => $t->status === TicketStatus::Closed)
            ->map(function ($t) {
                $val = (float) ($t->resolution_time ?? 0);
                return $val <= 0 ? (1.0 / 60.0) : $val;
            });

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'employee_id' => $user->employee_id,
            ],
            'tickets' => $tickets->map(fn (Ticket $ticket) => $this->transformTicket($ticket))->values()->all(),
            'summary' => [
                'total' => $tickets->count(),
                'open' => $tickets->where('status', TicketStatus::Assigned)->count(),
                'in_progress' => $tickets->where('status', TicketStatus::InProgress)->count(),
                'pending' => $tickets->where('status', TicketStatus::PendingOnHold)->count(),
                'closed' => $tickets->where('status', TicketStatus::Closed)->count(),
                'avg_response_time_seconds' => $responseTimes->isNotEmpty()
                    ? (int) round($responseTimes->avg())
                    : null,
                'avg_response_time_label' => $responseTimes->isNotEmpty()
                    ? $this->formatDuration((int) round($responseTimes->avg()))
                    : null,
                'avg_resolution_time_hours' => $resolutionTimes->isNotEmpty()
                    ? round($resolutionTimes->avg(), 2)
                    : null,
                'avg_resolution_time_label' => $resolutionTimes->isNotEmpty()
                    ? $this->formatHours((float) $resolutionTimes->avg())
                    : null,
                'resolved_count' => $resolutionTimes->count(),
            ],
            'filters' => [
                'status' => $status,
                'search' => $search,
                'month' => $month,
                'year' => $year,
            ],
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
            'first_seen_at' => $ticket->first_seen_at?->toIso8601String(),
            'in_progress_at' => $ticket->in_progress_at?->toIso8601String(),
            'status_changed_at' => $ticket->status_changed_at?->toIso8601String(),
            'disappeared_at' => $ticket->disappeared_at?->toIso8601String(),
            'response_time_seconds' => $ticket->response_time_seconds,
            'response_time_label' => $ticket->response_time_seconds !== null
                ? $this->formatDuration($ticket->response_time_seconds)
                : null,
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

    protected function formatHours(float $hours): string
    {
        if ($hours < 1) {
            return round($hours * 60).' mnt';
        }

        if ($hours < 24) {
            $wholeHours = (int) floor($hours);
            $minutes = (int) round(($hours - $wholeHours) * 60);

            return $minutes > 0 ? "{$wholeHours} jam {$minutes} mnt" : "{$wholeHours} jam";
        }

        $days = (int) floor($hours / 24);
        $restHours = (int) round($hours - ($days * 24));

        return $restHours > 0 ? "{$days} hari {$restHours} jam" : "{$days} hari";
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
