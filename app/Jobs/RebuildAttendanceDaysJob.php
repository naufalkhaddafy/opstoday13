<?php

namespace App\Jobs;

use App\Models\User;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RebuildAttendanceDaysJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param  list<string>  $workDates  Date strings (Y-m-d)
     */
    public function __construct(
        public int $userId,
        public array $workDates,
        public bool $allowAbsentMarking = true,
    ) {}

    public function handle(AttendanceDayRepositoryInterface $dayRepository): void
    {
        $user = User::query()->find($this->userId);

        if ($user === null) {
            return;
        }

        $timezone = config('app.timezone', 'Asia/Jakarta');

        foreach ($this->workDates as $workDate) {
            $dayRepository->rebuildForUserAndDate(
                $user,
                CarbonImmutable::parse($workDate, $timezone),
                $this->allowAbsentMarking,
            );
        }
    }
}
