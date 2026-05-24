<?php

namespace App\Models;

use App\Enums\AttendanceLogStatus;
use Database\Factories\AttendanceLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'employee_id',
    'user_id',
    'company_id',
    'status',
    'punched_at',
    'work_date',
    'sync_batch_id',
])]
class AttendanceLog extends Model
{
    /** @use HasFactory<AttendanceLogFactory> */
    use HasFactory;

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => AttendanceLogStatus::class,
            'punched_at' => 'datetime',
            'work_date' => 'date',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Company, $this>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * @return BelongsTo<AttendanceSyncRun, $this>
     */
    public function syncRun(): BelongsTo
    {
        return $this->belongsTo(AttendanceSyncRun::class, 'sync_batch_id');
    }
}
