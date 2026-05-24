<?php

namespace App\Console\Commands;

use App\Services\Attendance\AttendanceSyncService;
use Illuminate\Console\Command;

class SyncAttendanceCommand extends Command
{
    protected $signature = 'attendance:sync';

    protected $description = 'Sync attendance logs from fingerprint API and rebuild daily summaries';

    public function handle(AttendanceSyncService $syncService): int
    {
        $this->info('Starting attendance sync...');

        $run = $syncService->sync();

        $this->info(sprintf(
            'Sync complete. Fetched: %d, Inserted: %d, Skipped (duplicate): %d',
            $run->fetched_count,
            $run->inserted_count,
            $run->skipped_duplicate_count,
        ));

        return self::SUCCESS;
    }
}
