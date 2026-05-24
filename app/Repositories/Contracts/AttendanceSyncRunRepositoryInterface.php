<?php

namespace App\Repositories\Contracts;

use App\Enums\AttendanceSyncRunStatus;
use App\Models\AttendanceSyncRun;
use Carbon\CarbonImmutable;

interface AttendanceSyncRunRepositoryInterface
{
    public function start(CarbonImmutable $windowFrom, CarbonImmutable $windowTo): AttendanceSyncRun;

    public function finish(
        AttendanceSyncRun $run,
        AttendanceSyncRunStatus $status,
        int $fetched,
        int $inserted,
        int $skipped,
        ?string $errorMessage = null,
    ): AttendanceSyncRun;
}
