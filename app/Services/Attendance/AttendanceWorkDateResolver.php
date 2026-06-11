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
        protected \App\Repositories\Contracts\HolidayRepositoryInterface $holidayRepository,
        ?string $timezone = null,
    ) {
        $this->timezone = $timezone ?? config('app.timezone');
    }

    /**
     * @return array{work_date: CarbonImmutable, shift: Shift}|null
     */
    public function resolve(User $user, CarbonImmutable $punchedAt, ?string $status = null): ?array
    {
        $punchedAt = $punchedAt->timezone($this->timezone);

        if ($status !== null && strtolower($status) === 'keluar') {
            $lastIn = \App\Models\AttendanceLog::where('user_id', $user->id)
                ->where('status', 'hadir')
                ->where('punched_at', '<', $punchedAt)
                ->where('punched_at', '>=', $punchedAt->subHours(16))
                ->orderByDesc('punched_at')
                ->first();

            if ($lastIn !== null) {
                // Selesaikan ulang untuk check-in sebelumnya agar work_date dan shift sama persis
                $resolvedIn = $this->resolve($user, CarbonImmutable::instance($lastIn->punched_at), 'hadir');
                \Illuminate\Support\Facades\Log::info("KELUAR PUNCH {$punchedAt} FOUND LAST IN {$lastIn->punched_at}. RESOLVED TO: " . ($resolvedIn ? $resolvedIn['work_date'] : 'null'));
                if ($resolvedIn !== null) {
                    return $resolvedIn;
                }
            } else {
                \Illuminate\Support\Facades\Log::info("KELUAR PUNCH {$punchedAt} DID NOT FIND LAST IN");
            }
        }

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
            $bestOverallMatch = null;
            $bestOverallDiff = PHP_INT_MAX;

            foreach ($this->candidateWorkDates($punchedAt) as $workDate) {
                // If an exception exists for this candidate date, skip checking the weekly assignment
                if (UserShiftException::where('user_id', $user->id)->where('date', $workDate->toDateString())->exists()) {
                    continue;
                }

                // If it's a global holiday, skip checking the weekly assignment
                if ($this->holidayRepository->isHoliday($workDate->toDateString())) {
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

                    foreach ($realShifts as $realShift) {
                        [$start, $end] = $realShift->windowForWorkDate($workDate, $this->timezone);
                        $matchStart = $start->subHours(4);
                        $matchEnd = $end->addHours(4);

                        if ($punchedAt->gte($matchStart) && $punchedAt->lt($matchEnd)) {
                            $diff = abs($punchedAt->diffInMinutes($start));
                            if ($diff < $bestOverallDiff) {
                                $bestOverallDiff = $diff;
                                $bestOverallMatch = [
                                    'work_date' => $workDate->startOfDay(),
                                    'shift' => $realShift,
                                ];
                            }
                        }
                    }
                } else {
                    // Shift spesifik langsung — periksa window dengan padding (4 jam sebelum, 4 jam sesudah)
                    [$start, $end] = $assignedShift->windowForWorkDate($workDate, $this->timezone);
                    $matchStart = $start->subHours(4);
                    $matchEnd = $end->addHours(4);

                    if ($punchedAt->gte($matchStart) && $punchedAt->lt($matchEnd)) {
                        $diff = abs($punchedAt->diffInMinutes($start));
                        if ($diff < $bestOverallDiff) {
                            $bestOverallDiff = $diff;
                            $bestOverallMatch = [
                                'work_date' => $workDate->startOfDay(),
                                'shift' => $assignedShift,
                            ];
                        }
                    }
                }
            }

            if ($bestOverallMatch !== null) {
                return $bestOverallMatch;
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

            // Beri toleransi 4 jam sebelum shift mulai dan 4 jam setelah shift selesai
            $matchStart = $start->subHours(4);
            $matchEnd = $end->addHours(4);

            if ($punchedAt->gte($matchStart) && $punchedAt->lt($matchEnd)) {
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
        // First check if there's an explicit exception for today.
        $dateStr = $punchedAt->toDateString();
        $exception = UserShiftException::where('user_id', $user->id)
            ->where('date', $dateStr)
            ->first();

        if ($exception !== null) {
            if ($exception->shift_id === null) {
                return null;
            }
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

        // Cari shift fallback (shift pertama yang bukan null di jadwal)
        $fallbackShiftId = collect($assignment->schedule)->filter()->first();
        if ($fallbackShiftId === null) {
            return null;
        }

        $fallbackShift = Shift::find($fallbackShiftId);
        if ($fallbackShift === null) {
            return null;
        }

        // Jika fallback adalah placeholder, kita cari shift riil yang paling cocok di semua candidate date
        if (in_array($fallbackShift->code, self::PLACEHOLDER_CODES, true)) {
            $realShifts = Shift::where('type', $fallbackShift->type)
                ->whereNotIn('code', self::PLACEHOLDER_CODES)
                ->get();

            $bestOverallMatch = null;
            $bestOverallDiff = PHP_INT_MAX;

            foreach ($this->candidateWorkDates($punchedAt) as $workDate) {
                foreach ($realShifts as $realShift) {
                    [$start, $end] = $realShift->windowForWorkDate($workDate, $this->timezone);
                    $matchStart = $start->subHours(4);
                    $matchEnd = $end->addHours(4);

                    if ($punchedAt->gte($matchStart) && $punchedAt->lt($matchEnd)) {
                        $diff = abs($punchedAt->diffInMinutes($start));
                        if ($diff < $bestOverallDiff) {
                            $bestOverallDiff = $diff;
                            $bestOverallMatch = [
                                'work_date' => $workDate->startOfDay(),
                                'shift' => $realShift,
                            ];
                        }
                    }
                }
            }

            if ($bestOverallMatch !== null) {
                return $bestOverallMatch;
            }
        }

        // Jika gagal auto-match atau bukan placeholder, gunakan rule bawaan untuk hari h
        $workDate = match ($fallbackShift->work_date_rule) {
            ShiftWorkDateRule::NextDay => $punchedAt->hour >= 23
                ? $punchedAt->addDay()->startOfDay()
                : ($punchedAt->hour < 8 ? $punchedAt->startOfDay() : $punchedAt->startOfDay()),
            ShiftWorkDateRule::CalendarDay => $punchedAt->startOfDay(),
        };

        return [
            'work_date' => $workDate,
            'shift' => $fallbackShift,
        ];
    }
}
