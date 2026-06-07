<?php

namespace App\Console\Commands;

use App\Services\Ticket\TicketSyncService;
use Illuminate\Console\Command;

class SyncCompletedTicketsCommand extends Command
{
    protected $signature = 'tickets:sync-completed';

    protected $description = 'Reconcile completed tickets from the SIHEPI API (full list, filtered to our technicians)';

    public function handle(TicketSyncService $syncService): int
    {
        $run = $syncService->syncCompleted();

        $this->info(sprintf(
            'Completed ticket sync complete. Fetched: %d, Inserted: %d, Updated: %d, Skipped: %d',
            $run->fetched_count,
            $run->inserted_count,
            $run->updated_count,
            $run->skipped_count,
        ));

        return self::SUCCESS;
    }
}
