<?php

namespace App\Repositories\Contracts;

use App\Models\AttendanceDay;
use App\Models\User;
use Carbon\CarbonImmutable;

interface AttendanceDayRepositoryInterface
{
    public function rebuildForUserAndDate(
        User $user,
        CarbonImmutable $workDate,
        bool $allowAbsentMarking = true,
    ): AttendanceDay;

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, AttendanceDay>
     */
    public function getForUserInDateRange(
        User $user,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): \Illuminate\Database\Eloquent\Collection;
}
