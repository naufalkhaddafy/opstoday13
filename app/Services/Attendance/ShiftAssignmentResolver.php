<?php

namespace App\Services\Attendance;

use App\Models\Shift;
use App\Models\User;
use App\Models\UserShiftAssignment;
use Carbon\CarbonImmutable;

class ShiftAssignmentResolver
{
    /**
     * Cache for Shift models to avoid repeated DB lookups.
     *
     * @var array<int, Shift|null>
     */
    private array $shiftCache = [];

    public function forWorkDate(User $user, CarbonImmutable $workDate): ?UserShiftAssignment
    {
        $date = $workDate->toDateString();

        // Use eager-loaded relation if available (avoids N+1 in roster)
        if ($user->relationLoaded('shiftAssignments')) {
            return $user->shiftAssignments
                ->filter(fn (UserShiftAssignment $a) =>
                    $a->effective_from->format('Y-m-d') <= $date
                    && ($a->effective_to === null || $a->effective_to->format('Y-m-d') >= $date)
                )
                ->sortByDesc(fn (UserShiftAssignment $a) => $a->effective_from->format('Y-m-d'))
                ->first(fn (UserShiftAssignment $a): bool => $a->isActiveOn($workDate));
        }

        // Fallback: query database
        return $user->shiftAssignments()
            ->where('effective_from', '<=', $date)
            ->where(function ($query) use ($date): void {
                $query->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $date);
            })
            ->orderByDesc('effective_from')
            ->get()
            ->first(fn (UserShiftAssignment $assignment): bool => $assignment->isActiveOn($workDate));
    }

    public function shiftForWorkDate(User $user, CarbonImmutable $workDate): ?Shift
    {
        $dateStr = $workDate->toDateString();

        // Check if there is an exception for this specific date
        if ($user->relationLoaded('exceptions')) {
            $exception = $user->exceptions->first(fn($e) => $e->date->toDateString() === $dateStr);
        } else {
            $exception = \App\Models\UserShiftException::where('user_id', $user->id)
                ->where('date', $dateStr)
                ->first();
        }

        if ($exception !== null) {
            return $exception->shift_id !== null ? $this->findShift($exception->shift_id) : null;
        }

        // Fallback to weekly schedule
        $assignment = $this->forWorkDate($user, $workDate);

        if ($assignment === null || $assignment->schedule === null) {
            return null;
        }

        $dayOfWeek = $workDate->dayOfWeekIso;
        $shiftId = $assignment->schedule[$dayOfWeek] ?? $assignment->schedule[(string) $dayOfWeek] ?? null;

        if ($shiftId === null) {
            return null;
        }

        return $this->findShift((int) $shiftId);
    }

    /**
     * Find a Shift by ID with in-memory caching to avoid repeated queries.
     */
    private function findShift(int $id): ?Shift
    {
        if (! array_key_exists($id, $this->shiftCache)) {
            $this->shiftCache[$id] = Shift::find($id);
        }

        return $this->shiftCache[$id];
    }
}
