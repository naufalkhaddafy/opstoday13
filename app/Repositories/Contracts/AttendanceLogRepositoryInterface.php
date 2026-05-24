<?php

namespace App\Repositories\Contracts;

use App\Models\AttendanceSyncRun;
use App\Models\User;
use Carbon\CarbonImmutable;

interface AttendanceLogRepositoryInterface
{
    /**
     * @param  array{employee_id: string, status: string, punched_at: CarbonImmutable}  $record
     */
    public function insertFromSyncRecord(
        array $record,
        ?User $user,
        CarbonImmutable $workDate,
        AttendanceSyncRun $syncRun,
    ): bool;

    public function normalizePunchedAt(CarbonImmutable $punchedAt): CarbonImmutable;
}
