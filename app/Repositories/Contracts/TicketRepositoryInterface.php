<?php

namespace App\Repositories\Contracts;

use App\Models\TicketSyncRun;

interface TicketRepositoryInterface
{
    /**
     * Upsert a single open ticket polled for a technician.
     *
     * @param  array<string, mixed>  $record
     * @return bool True when a new ticket row was inserted, false when an existing one was updated.
     */
    public function upsertOpen(array $record, string $polledTechnicianId, TicketSyncRun $run): bool;

    /**
     * Upsert a single completed ticket.
     *
     * @param  array<string, mixed>  $record
     * @return bool True when a new ticket row was inserted (historical backfill), false when updated.
     */
    public function upsertCompleted(array $record, TicketSyncRun $run): bool;

    /**
     * Flag still-open tickets that were not seen in the latest open sync.
     *
     * @param  list<string>  $seenTicketNos
     * @return int Number of tickets newly marked as disappeared.
     */
    public function markDisappeared(array $seenTicketNos): int;
}
