<?php

namespace App\Services\Attendance;

use App\Repositories\Contracts\FingerprintClientInterface;
use App\Enums\AttendanceSyncRunStatus;
use App\Models\AttendanceSyncRun;
use App\Models\User;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Repositories\Contracts\AttendanceLogRepositoryInterface;
use App\Repositories\Contracts\AttendanceSyncRunRepositoryInterface;
use Carbon\CarbonImmutable;

class AttendanceSyncService
{
    protected string $timezone;

    public function __construct(
        protected FingerprintClientInterface $fingerprintClient,
        protected AttendanceLogRepositoryInterface $logRepository,
        protected AttendanceSyncRunRepositoryInterface $syncRunRepository,
        protected AttendanceDayRepositoryInterface $dayRepository,
        protected AttendanceWorkDateResolver $workDateResolver,
        protected AttendanceSyncWindowResolver $windowResolver,
        ?string $timezone = null,
    ) {
        $this->timezone = $timezone ?? config('app.timezone');
    }

    public function sync(?CarbonImmutable $now = null): AttendanceSyncRun
    {
        $now ??= CarbonImmutable::now($this->timezone);
        $config = $this->windowResolver->resolve($now);

        $run = $this->syncRunRepository->start($config['window_from'], $config['window_to']);

        try {
            $records = $this->fingerprintClient->fetch();
            $fetched = count($records);
            $inserted = 0;
            $skipped = 0;
            $affected = [];

            foreach ($records as $record) {
                $user = User::query()->where('employee_id', $record['employee_id'])->first();

                if ($user === null) {
                    $skipped++;
                    continue;
                }

                $punchedAt = $this->logRepository->normalizePunchedAt($record['punched_at']);
                $workDate = $this->workDateResolver->resolve($user, $punchedAt, $record['status'])['work_date'] ?? $punchedAt->startOfDay();

                if ($this->logRepository->insertFromSyncRecord(
                    [
                        'employee_id' => $record['employee_id'],
                        'status' => $record['status'],
                        'punched_at' => $punchedAt,
                    ],
                    $user,
                    $workDate,
                    $run,
                )) {
                    $inserted++;
                    $affected[$user->id][] = $workDate->toDateString();
                } else {
                    $skipped++;
                }
            }

            foreach ($config['rebuild_dates'] as $workDate) {
                $this->rebuildUsersForDate($workDate, $config['allow_absent_marking']);
            }

            foreach ($affected as $userId => $dates) {
                $user = User::query()->find($userId);

                if ($user === null) {
                    continue;
                }

                foreach (array_unique($dates) as $date) {
                    $this->dayRepository->rebuildForUserAndDate(
                        $user,
                        CarbonImmutable::parse($date, $this->timezone),
                        $config['allow_absent_marking'],
                    );
                }
            }

            return $this->syncRunRepository->finish(
                $run,
                AttendanceSyncRunStatus::Success,
                $fetched,
                $inserted,
                $skipped,
            );
        } catch (\Throwable $exception) {
            $this->syncRunRepository->finish(
                $run,
                AttendanceSyncRunStatus::Failed,
                0,
                0,
                0,
                $exception->getMessage(),
            );

            throw $exception;
        }
    }

    protected function rebuildUsersForDate(CarbonImmutable $workDate, bool $allowAbsentMarking): void
    {
        User::query()
            ->whereNotNull('employee_id')
            ->whereHas('shiftAssignments')
            ->each(function (User $user) use ($workDate, $allowAbsentMarking): void {
                $this->dayRepository->rebuildForUserAndDate($user, $workDate, $allowAbsentMarking);
            });
    }
}
