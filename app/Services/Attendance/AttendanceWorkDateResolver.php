<?php

namespace App\Services\Attendance;

use App\Enums\ShiftWorkDateRule;
use App\Models\Shift;
use App\Models\User;
use App\Models\UserShiftAssignment;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class AttendanceWorkDateResolver
{
    public function __construct(
        protected string $timezone = 'Asia/Jakarta',
    ) {}

    /**
     * @return array{work_date: CarbonImmutable, shift: Shift}|null
     */
    public function resolve(User $user, CarbonImmutable $punchedAt): ?array
    {
        $punchedAt = $punchedAt->timezone($this->timezone);
        $assignments = $this->activeAssignments($user, $punchedAt);

        foreach ($assignments as $assignment) {
            $shift = $assignment->shift;

            foreach ($this->candidateWorkDates($punchedAt) as $workDate) {
                if (! $assignment->isActiveOn($workDate)) {
                    continue;
                }

                [$start, $end] = $shift->windowForWorkDate($workDate, $this->timezone);

                if ($punchedAt->gte($start) && $punchedAt->lt($end)) {
                    return [
                        'work_date' => $workDate->startOfDay(),
                        'shift' => $shift,
                    ];
                }
            }
        }

        return $this->fallbackByRule($user, $punchedAt);
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public function shiftBounds(Shift $shift, CarbonImmutable $workDate): array
    {
        return $shift->windowForWorkDate($workDate->startOfDay(), $this->timezone);
    }

    /**
     * @return Collection<int, UserShiftAssignment>
     */
    protected function activeAssignments(User $user, CarbonImmutable $punchedAt): Collection
    {
        return $user->shiftAssignments()
            ->with('shift')
            ->where('effective_from', '<=', $punchedAt->toDateString())
            ->where(function ($query) use ($punchedAt): void {
                $query->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $punchedAt->toDateString());
            })
            ->orderByDesc('effective_from')
            ->get();
    }

    /**
     * @return list<CarbonImmutable>
     */
    protected function candidateWorkDates(CarbonImmutable $punchedAt): array
    {
        $today = $punchedAt->startOfDay();

        return [
            $today->subDay(),
            $today,
            $today->addDay(),
        ];
    }

    /**
     * @return array{work_date: CarbonImmutable, shift: Shift}|null
     */
    protected function fallbackByRule(User $user, CarbonImmutable $punchedAt): ?array
    {
        $assignment = $user->shiftAssignments()->with('shift')->orderByDesc('effective_from')->first();

        if ($assignment === null) {
            return null;
        }

        $shift = $assignment->shift;
        $workDate = match ($shift->work_date_rule) {
            ShiftWorkDateRule::NextDay => $punchedAt->hour >= 23
                ? $punchedAt->addDay()->startOfDay()
                : ($punchedAt->hour < 8 ? $punchedAt->startOfDay() : $punchedAt->startOfDay()),
            ShiftWorkDateRule::CalendarDay => $punchedAt->startOfDay(),
        };

        return [
            'work_date' => $workDate,
            'shift' => $shift,
        ];
    }
}
