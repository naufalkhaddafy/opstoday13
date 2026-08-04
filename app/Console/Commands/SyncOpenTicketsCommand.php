<?php

namespace App\Console\Commands;

use App\Enums\TicketSyncRunStatus;
use App\Models\ScheduleLog;
use App\Services\Ticket\TicketSyncService;
use Illuminate\Console\Command;

class SyncOpenTicketsCommand extends Command
{
    protected $signature = 'tickets:sync-open';

    protected $description = 'Sync open/active tickets from the SIHEPI API for every technician';

    public function handle(TicketSyncService $syncService): int
    {
        $startTime = microtime(true);
        $startedAt = now();
        $this->info('Starting open tickets sync...');
        
        $log = ScheduleLog::create([
            'command' => 'tickets:sync-open',
            'status' => 'running',
            'started_at' => $startedAt,
        ]);

        try {
            $run = $syncService->syncOpen();

            $outputMsg = sprintf(
                'Open ticket sync complete. Fetched: %d, Inserted: %d, Updated: %d, Skipped: %d',
                $run->fetched_count,
                $run->inserted_count,
                $run->updated_count,
                $run->skipped_count,
            );
            $this->info($outputMsg);

            $log->update([
                'status' => $run->status === TicketSyncRunStatus::Success ? 'success' : 'failed',
                'finished_at' => now(),
                'duration' => round((microtime(true) - $startTime) * 1000),
                'output' => $outputMsg,
                'metadata' => [
                    'fetched' => $run->fetched_count,
                    'inserted' => $run->inserted_count,
                    'updated' => $run->updated_count,
                    'skipped' => $run->skipped_count,
                    'error_message' => $run->error_message,
                ],
            ]);

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'finished_at' => now(),
                'duration' => round((microtime(true) - $startTime) * 1000),
                'output' => "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString(),
            ]);
            
            $this->error($e->getMessage());
            return self::FAILURE;
        }
    }
}
