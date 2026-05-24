<?php

namespace App\Repositories\Eloquent;

use App\Enums\AttendanceSyncRunStatus;
use App\Models\AttendanceSyncRun;
use App\Repositories\Contracts\AttendanceSyncRunRepositoryInterface;
use Carbon\CarbonImmutable;

class AttendanceSyncRunRepository implements AttendanceSyncRunRepositoryInterface
{
    public function start(CarbonImmutable $windowFrom, CarbonImmutable $windowTo): AttendanceSyncRun
    {
        return AttendanceSyncRun::query()->create([
            'started_at' => now(),
            'window_from' => $windowFrom,
            'window_to' => $windowTo,
            'status' => AttendanceSyncRunStatus::Running,
        ]);
    }

    public function finish(
        AttendanceSyncRun $run,
        AttendanceSyncRunStatus $status,
        int $fetched,
        int $inserted,
        int $skipped,
        ?string $errorMessage = null,
    ): AttendanceSyncRun {
        $run->update([
            'finished_at' => now(),
            'status' => $status,
            'fetched_count' => $fetched,
            'inserted_count' => $inserted,
            'skipped_duplicate_count' => $skipped,
            'error_message' => $errorMessage,
        ]);

        return $run->fresh();
    }
}
