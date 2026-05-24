<?php

namespace App\Services\Attendance;

use App\Models\Shift;
use App\Models\User;
use App\Models\UserShiftAssignment;
use Carbon\CarbonImmutable;

class ShiftAssignmentResolver
{
    public function forWorkDate(User $user, CarbonImmutable $workDate): ?UserShiftAssignment
    {
        $date = $workDate->toDateString();

        return $user->shiftAssignments()
            ->with('shift')
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
        return $this->forWorkDate($user, $workDate)?->shift;
    }
}
