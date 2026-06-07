<?php

namespace App\Console\Commands;

use App\Services\Ticket\TicketSyncService;
use Illuminate\Console\Command;

class SyncOpenTicketsCommand extends Command
{
    protected $signature = 'tickets:sync-open';

    protected $description = 'Sync open/active tickets from the SIHEPI API for every technician';

    public function handle(TicketSyncService $syncService): int
    {
        $run = $syncService->syncOpen();

        $this->info(sprintf(
            'Open ticket sync complete. Fetched: %d, Inserted: %d, Updated: %d, Skipped: %d',
            $run->fetched_count,
            $run->inserted_count,
            $run->updated_count,
            $run->skipped_count,
        ));

        return self::SUCCESS;
    }
}
