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
}
