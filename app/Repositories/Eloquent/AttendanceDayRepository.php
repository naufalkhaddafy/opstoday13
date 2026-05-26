<?php

namespace App\Repositories\Eloquent;

use App\Models\AttendanceDay;
use App\Models\User;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Services\Attendance\AttendanceDayAggregator;
use Carbon\CarbonImmutable;

class AttendanceDayRepository implements AttendanceDayRepositoryInterface
{
    public function __construct(
        protected AttendanceDayAggregator $aggregator,
    ) {}

    public function rebuildForUserAndDate(
        User $user,
        CarbonImmutable $workDate,
        bool $allowAbsentMarking = true,
    ): AttendanceDay {
        return $this->aggregator->rebuildForUserAndDate($user, $workDate, $allowAbsentMarking);
    }

    public function getForUserInDateRange(
        User $user,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): \Illuminate\Database\Eloquent\Collection {
        return AttendanceDay::query()
            ->with('shift')
            ->where('user_id', $user->id)
            ->whereBetween('work_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();
    }
}
