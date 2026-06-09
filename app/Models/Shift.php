<?php

namespace App\Models;

use App\Enums\ShiftType;
use App\Enums\ShiftWorkDateRule;
use Carbon\CarbonImmutable;
use Database\Factories\ShiftFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable([
    'code',
    'name',
    'start_time',
    'end_time',
    'is_overnight',
    'work_date_rule',
    'grace_minutes',
    'type',
])]
class Shift extends Model
{
    /** @use HasFactory<ShiftFactory> */
    use HasFactory, LogsActivity;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_overnight' => 'boolean',
            'work_date_rule' => ShiftWorkDateRule::class,
            'type' => ShiftType::class,
            'grace_minutes' => 'integer',
        ];
    }



    public function assignmentsCount(): int
    {
        $shiftId = $this->id;
        return UserShiftAssignment::query()
            ->where(function ($q) use ($shiftId) {
                for ($day = 1; $day <= 7; $day++) {
                    $q->orWhere('schedule->' . $day, $shiftId)
                      ->orWhere('schedule->' . (string) $day, $shiftId);
                }
            })
            ->count();
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public function windowForWorkDate(CarbonImmutable $workDate, ?string $timezone = null): array
    {
        $timezone ??= config('app.timezone');
        $workDate = $workDate->timezone($timezone)->startOfDay();

        if ($this->work_date_rule === ShiftWorkDateRule::NextDay) {
            $start = $workDate->subDay()->setTimeFromTimeString((string) $this->start_time);
            $end = $workDate->setTimeFromTimeString((string) $this->end_time);

            return [$start, $end];
        }

        $start = $workDate->setTimeFromTimeString((string) $this->start_time);
        $endTime = (string) $this->end_time;

        if ($endTime === '00:00:00' || $endTime === '00:00' || $endTime === '24:00:00' || $endTime === '24:00') {
            $end = $workDate->addDay()->startOfDay();
        } else {
            $end = $workDate->setTimeFromTimeString($endTime);
        }

        return [$start, $end];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
