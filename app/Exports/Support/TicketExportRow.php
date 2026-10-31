<?php

namespace App\Exports\Support;

use App\Models\Ticket;

class TicketExportRow
{
    public static function map(Ticket $ticket): array
    {
        $nonStandard = preg_match('/[a-zA-Z]/', (string) $ticket->ticket_no);

        return [
            $ticket->ticket_no,
            $ticket->status?->value ?? '',
            $ticket->requested_for,
            $ticket->assignedUser?->name ?? $ticket->assigned_to_name,
            $ticket->api_creation_date?->format('Y-m-d') ?? '',
            $ticket->completed_date?->format('Y-m-d') ?? '',
            ! $nonStandard && $ticket->response_time_seconds !== null ? self::duration((int) $ticket->response_time_seconds) : '-',
            ! $nonStandard && is_numeric($ticket->resolution_time) ? self::hours((float) $ticket->resolution_time) : '-',
        ];
    }

    private static function duration(int $seconds): string
    {
        if ($seconds < 60) {
            return $seconds.'s';
        }

        $minutes = intdiv($seconds, 60);
        if ($minutes < 60) {
            return $minutes.' min';
        }

        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;
        if ($hours < 24) {
            return $rest > 0 ? "{$hours}h {$rest}m" : "{$hours}h";
        }

        $days = intdiv($hours, 24);
        $rest = $hours % 24;

        return $rest > 0 ? "{$days}d {$rest}h" : "{$days}d";
    }

    private static function hours(float $hours): string
    {
        if ($hours < 1) {
            return round($hours * 60).' min';
        }

        if ($hours < 24) {
            $whole = (int) floor($hours);
            $minutes = (int) round(($hours - $whole) * 60);

            return $minutes > 0 ? "{$whole}h {$minutes}m" : "{$whole}h";
        }

        $days = (int) floor($hours / 24);
        $rest = (int) round($hours - ($days * 24));

        return $rest > 0 ? "{$days}d {$rest}h" : "{$days}d";
    }
}
