<?php

namespace App\Console\Commands;

use App\Enums\AttendanceSyncRunStatus;
use App\Models\ScheduleLog;
use App\Services\Attendance\AttendanceSyncService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class SyncAttendanceCommand extends Command
{
    protected $signature = 'attendance:sync {--date= : Custom date to sync (YYYY-MM-DD)}';

    protected $description = 'Sync attendance logs from fingerprint API and rebuild daily summaries';

    public function handle(AttendanceSyncService $syncService): int
    {
        $startTime = microtime(true);
        $startedAt = now();
        $this->info('Starting attendance sync...');
        
        $log = ScheduleLog::create([
            'command' => 'attendance:sync',
            'status' => 'running',
            'started_at' => $startedAt,
        ]);

        $dateOption = $this->option('date');
        $now = null;
        if ($dateOption) {
            $timezone = config('app.timezone');
            $now = CarbonImmutable::createFromFormat('Y-m-d', $dateOption, $timezone)->setTime(10, 0);
            $this->info("Syncing with simulated time: {$now->toDateTimeString()}");
        }

        try {
            $run = $syncService->sync($now);

            $outputMsg = sprintf(
                'Sync complete. Fetched: %d, Inserted: %d, Skipped (duplicate): %d',
                $run->fetched_count,
                $run->inserted_count,
                $run->skipped_duplicate_count,
            );
            $this->info($outputMsg);

            $log->update([
                'status' => $run->status === AttendanceSyncRunStatus::Success ? 'success' : 'failed',
                'finished_at' => now(),
                'duration' => round((microtime(true) - $startTime) * 1000),
                'output' => $outputMsg,
                'metadata' => [
                    'fetched' => $run->fetched_count,
                    'inserted' => $run->inserted_count,
                    'skipped' => $run->skipped_duplicate_count,
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
