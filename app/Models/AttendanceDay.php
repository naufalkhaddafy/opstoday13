<?php

namespace App\Models;

use App\Enums\AttendancePresenceStatus;
use App\Enums\AttendanceTimingStatus;
use Database\Factories\AttendanceDayFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'company_id',
    'work_date',
    'shift_id',
    'check_in_at',
    'check_out_at',
    'presence_status',
    'timing_status',
    'late_minutes',
    'early_leave_minutes',
    'overtime_minutes',
    'computed_at',
])]
class AttendanceDay extends Model
{
    /** @use HasFactory<AttendanceDayFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'check_in_at' => 'datetime',
            'check_out_at' => 'datetime',
            'presence_status' => AttendancePresenceStatus::class,
            'timing_status' => AttendanceTimingStatus::class,
            'late_minutes' => 'integer',
            'early_leave_minutes' => 'integer',
            'overtime_minutes' => 'integer',
            'computed_at' => 'datetime',
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
     * @return BelongsTo<Shift, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
