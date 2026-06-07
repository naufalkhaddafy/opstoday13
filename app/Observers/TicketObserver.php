<?php

namespace App\Observers;

use App\Models\Ticket;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TicketObserver
{
    protected const PENDING_INDEX_KEY = 'tickets.pending.all';

    /**
     * Mirror the latest ticket snapshot into Redis. SQL stays the source of truth;
     * Redis is a derived read cache for fast per-minute lookups and dashboard reads.
     */
    public function saved(Ticket $ticket): void
    {
        $this->safely(function () use ($ticket): void {
            Cache::store('redis')->forever(
                $this->key($ticket->ticket_no),
                $this->snapshot($ticket),
            );

            Cache::store('redis')->forget(self::PENDING_INDEX_KEY);
        });
    }

    public function deleted(Ticket $ticket): void
    {
        $this->safely(function () use ($ticket): void {
            Cache::store('redis')->forget($this->key($ticket->ticket_no));
            Cache::store('redis')->forget(self::PENDING_INDEX_KEY);
        });
    }

    protected function key(string $ticketNo): string
    {
        return "ticket:{$ticketNo}";
    }

    /**
     * @return array<string, mixed>
     */
    protected function snapshot(Ticket $ticket): array
    {
        return $ticket->only([
            'id',
            'ticket_no',
            'title',
            'status',
            'assigned_to_id',
            'assigned_to_user_id',
            'first_seen_at',
            'status_changed_at',
            'in_progress_at',
            'response_time_seconds',
            'disappeared_at',
            'completed_date',
            'resolution_time',
        ]);
    }

    protected function safely(callable $callback): void
    {
        try {
            $callback();
        } catch (\Throwable $exception) {
            // Redis is a derived cache; never let its failure break ticket persistence.
            Log::warning('Ticket Redis cache update failed', [
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
