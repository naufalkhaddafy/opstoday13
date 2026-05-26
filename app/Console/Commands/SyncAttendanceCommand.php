<?php

namespace App\Console\Commands;

use App\Services\Attendance\AttendanceSyncService;
use Illuminate\Console\Command;

class SyncAttendanceCommand extends Command
{
    protected $signature = 'attendance:sync {--date= : Custom date to sync (YYYY-MM-DD)}';

    protected $description = 'Sync attendance logs from fingerprint API and rebuild daily summaries';

    public function handle(AttendanceSyncService $syncService): int
    {
        $this->info('Starting attendance sync...');

        $dateOption = $this->option('date');
        $now = null;
        if ($dateOption) {
            $timezone = config('app.timezone');
            $now = \Carbon\CarbonImmutable::createFromFormat('Y-m-d', $dateOption, $timezone)->setTime(10, 0);
            $this->info("Syncing with simulated time: {$now->toDateTimeString()}");
        }

        $run = $syncService->sync($now);

        $this->info(sprintf(
            'Sync complete. Fetched: %d, Inserted: %d, Skipped (duplicate): %d',
            $run->fetched_count,
            $run->inserted_count,
            $run->skipped_duplicate_count,
        ));

        return self::SUCCESS;
    }
}
