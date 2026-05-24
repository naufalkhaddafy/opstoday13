<?php

namespace App\Repositories\Eloquent;

use App\Enums\AttendanceLogStatus;
use App\Models\AttendanceSyncRun;
use App\Models\User;
use App\Repositories\Contracts\AttendanceLogRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class AttendanceLogRepository implements AttendanceLogRepositoryInterface
{
    public function insertFromSyncRecord(
        array $record,
        ?User $user,
        CarbonImmutable $workDate,
        AttendanceSyncRun $syncRun,
    ): bool {
        $punchedAt = $this->normalizePunchedAt($record['punched_at']);
        $status = AttendanceLogStatus::from($record['status']);

        $inserted = DB::table('attendance_logs')->insertOrIgnore([
            'employee_id' => $record['employee_id'],
            'user_id' => $user?->id,
            'company_id' => $user?->company_id,
            'status' => $status->value,
            'punched_at' => $punchedAt,
            'work_date' => $workDate->toDateString(),
            'sync_batch_id' => $syncRun->id,
            'created_at' => now(),
        ]);

        return $inserted === 1;
    }

    public function normalizePunchedAt(CarbonImmutable $punchedAt): CarbonImmutable
    {
        return $punchedAt->setSeconds($punchedAt->second)->setMicrosecond(0);
    }
}
