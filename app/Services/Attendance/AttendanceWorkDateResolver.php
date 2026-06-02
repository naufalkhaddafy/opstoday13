<?php

namespace App\Services\Attendance;

use App\Enums\ShiftType;
use App\Enums\ShiftWorkDateRule;
use App\Models\Shift;
use App\Models\User;
use App\Models\UserShiftAssignment;
use App\Models\UserShiftException;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class AttendanceWorkDateResolver
{
    protected string $timezone;

    /** @var string[] Kode placeholder — tidak ikut auto-match */
    protected const PLACEHOLDER_CODES = ['steady', 'shift'];

    public function __construct(
        ?string $timezone = null,
    ) {
        $this->timezone = $timezone ?? config('app.timezone');
    }

    /**
     * @return array{work_date: CarbonImmutable, shift: Shift}|null
     */
    public function resolve(User $user, CarbonImmutable $punchedAt): ?array
    {
        $punchedAt = $punchedAt->timezone($this->timezone);

        // Check each candidate date for an explicit exception
        foreach ($this->candidateWorkDates($punchedAt) as $workDate) {
            $dateStr = $workDate->toDateString();
            $exception = UserShiftException::where('user_id', $user->id)
                ->where('date', $dateStr)
                ->first();

            if ($exception !== null) {
                // If there's an exception, use it (skip if it's explicitly null/Libur)
                if ($exception->shift_id !== null) {
                    $shift = Shift::find($exception->shift_id);
                    if ($shift) {
                        [$start, $end] = $shift->windowForWorkDate($workDate, $this->timezone);
                        if ($punchedAt->gte($start) && $punchedAt->lt($end)) {
                            return [
                                'work_date' => $workDate->startOfDay(),
                                'shift' => $shift,
                            ];
                        }
                    }
                }
                // Don't fall through to normal assignment if an exception exists for this date, 
                // but we keep looping candidates in case it matches the previous/next day's exception window.
            }
        }

        $assignments = $this->activeAssignments($user, $punchedAt);

        foreach ($assignments as $assignment) {
            foreach ($this->candidateWorkDates($punchedAt) as $workDate) {
                // If an exception exists for this candidate date, skip checking the weekly assignment
                if (UserShiftException::where('user_id', $user->id)->where('date', $workDate->toDateString())->exists()) {
                    continue;
                }

                if (! $assignment->isActiveOn($workDate)) {
                    continue;
                }

                $dayOfWeek = $workDate->dayOfWeekIso;
                $shiftId = $assignment->schedule[$dayOfWeek] ?? $assignment->schedule[(string) $dayOfWeek] ?? null;

                if ($shiftId === null) {
                    continue;
                }

                $assignedShift = Shift::find($shiftId);
                if ($assignedShift === null) {
                    continue;
                }

                // Auto-match: cari shift riil terdekat berdasarkan tipe yang sama
                $isPlaceholder = in_array($assignedShift->code, self::PLACEHOLDER_CODES, true);

                if ($isPlaceholder) {
                    // Cari semua shift riil dengan tipe yang sama (exclude placeholder)
                    $realShifts = Shift::where('type', $assignedShift->type)
                        ->whereNotIn('code', self::PLACEHOLDER_CODES)
                        ->get();

                    $bestMatch = $this->findClosestShift($realShifts, $workDate, $punchedAt);

                    if ($bestMatch !== null) {
                        return [
                            'work_date' => $workDate->startOfDay(),
                            'shift' => $bestMatch,
                        ];
                    }
                } else {
                    // Shift spesifik langsung — periksa window
                    [$start, $end] = $assignedShift->windowForWorkDate($workDate, $this->timezone);

                    if ($punchedAt->gte($start) && $punchedAt->lt($end)) {
                        return [
                            'work_date' => $workDate->startOfDay(),
                            'shift' => $assignedShift,
                        ];
                    }
                }
            }
        }

        return $this->fallbackByRule($user, $punchedAt);
    }

    /**
     * Cari shift terdekat berdasarkan jarak menit dari jam masuk.
     *
     * @param  Collection<int, Shift>  $shifts
     */
    protected function findClosestShift(
        Collection $shifts,
        CarbonImmutable $workDate,
        CarbonImmutable $punchedAt,
    ): ?Shift {
        $candidates = [];

        foreach ($shifts as $shift) {
            [$start, $end] = $shift->windowForWorkDate($workDate, $this->timezone);

            if ($punchedAt->gte($start) && $punchedAt->lt($end)) {
                $candidates[] = [
                    'shift' => $shift,
                    'diff' => abs($punchedAt->diffInMinutes($start)),
                ];
            }
        }

        if (empty($candidates)) {
            return null;
        }

        usort($candidates, fn ($a, $b) => $a['diff'] <=> $b['diff']);

        return $candidates[0]['shift'];
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
        // First check if there's an explicit exception for today. If it's explicitly null (Libur), then don't fallback.
        $dateStr = $punchedAt->toDateString();
        $exception = UserShiftException::where('user_id', $user->id)
            ->where('date', $dateStr)
            ->first();

        if ($exception !== null) {
            // There's an exception. If shift_id is null, it's explicitly an off day, don't fall back to working.
            if ($exception->shift_id === null) {
                return null;
            }

            // If there's an exception shift, and we reached fallback, it means the time window didn't match.
            // But we shouldn't use fallback auto-match if an explicit exception exists.
            $shift = Shift::find($exception->shift_id);
            if ($shift) {
                return [
                    'work_date' => $punchedAt->startOfDay(),
                    'shift' => $shift,
                ];
            }
        }

        $assignment = $user->shiftAssignments()->orderByDesc('effective_from')->first();

        if ($assignment === null) {
            return null;
        }

        $dayOfWeek = $punchedAt->dayOfWeekIso;
        $shiftId = $assignment->schedule[$dayOfWeek] ?? $assignment->schedule[(string) $dayOfWeek] ?? null;

        if ($shiftId === null) {
            // Fallback to first non-null shift in the schedule
            $shiftId = collect($assignment->schedule)->filter()->first();
        }

        if ($shiftId === null) {
            return null;
        }

        $shift = Shift::find($shiftId);
        if ($shift === null) {
            return null;
        }

        // Jika placeholder, resolve ke shift riil terdekat
        if (in_array($shift->code, self::PLACEHOLDER_CODES, true)) {
            $realShifts = Shift::where('type', $shift->type)
                ->whereNotIn('code', self::PLACEHOLDER_CODES)
                ->get();

            $bestMatch = $this->findClosestShift($realShifts, $punchedAt->startOfDay(), $punchedAt);
            if ($bestMatch !== null) {
                $shift = $bestMatch;
            }
        }

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
