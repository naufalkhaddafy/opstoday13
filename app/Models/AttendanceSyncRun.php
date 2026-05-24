<?php

namespace App\Models;

use App\Enums\AttendanceSyncRunStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'started_at',
    'finished_at',
    'window_from',
    'window_to',
    'fetched_count',
    'inserted_count',
    'skipped_duplicate_count',
    'status',
    'error_message',
])]
class AttendanceSyncRun extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'window_from' => 'datetime',
            'window_to' => 'datetime',
            'status' => AttendanceSyncRunStatus::class,
            'fetched_count' => 'integer',
            'inserted_count' => 'integer',
            'skipped_duplicate_count' => 'integer',
        ];
    }

    /**
     * @return HasMany<AttendanceLog, $this>
     */
    public function logs(): HasMany
    {
        return $this->hasMany(AttendanceLog::class, 'sync_batch_id');
    }
}
