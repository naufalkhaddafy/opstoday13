<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\UserShiftAssignmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'shift_id',
    'effective_from',
    'effective_to',
    'days_of_week',
])]
class UserShiftAssignment extends Model
{
    /** @use HasFactory<UserShiftAssignmentFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_to' => 'date',
            'days_of_week' => 'array',
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
     * @return BelongsTo<Shift, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function isActiveOn(CarbonImmutable $workDate): bool
    {
        $date = $workDate->toDateString();

        if ($this->effective_from->format('Y-m-d') > $date) {
            return false;
        }

        if ($this->effective_to !== null && $this->effective_to->format('Y-m-d') < $date) {
            return false;
        }

        if ($this->days_of_week === null) {
            return true;
        }

        return in_array($workDate->dayOfWeekIso, $this->days_of_week, true);
    }
}
