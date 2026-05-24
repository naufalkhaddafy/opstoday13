<?php

namespace App\Services\Attendance;

use App\Enums\AttendanceLogStatus;
use App\Enums\AttendancePresenceStatus;
use App\Enums\AttendanceTimingStatus;
use App\Models\AttendanceDay;
use App\Models\AttendanceLog;
use App\Models\Shift;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class AttendanceDayAggregator
{
    public function __construct(
        protected AttendanceWorkDateResolver $workDateResolver,
        protected ShiftAssignmentResolver $shiftAssignmentResolver,
        protected string $timezone = 'Asia/Jakarta',
    ) {}

    public function rebuildForUserAndDate(User $user, CarbonImmutable $workDate, bool $allowAbsentMarking = true): AttendanceDay
    {
        $workDate = $workDate->timezone($this->timezone)->startOfDay();

        $logs = AttendanceLog::query()
            ->where('user_id', $user->id)
            ->whereDate('work_date', $workDate->toDateString())
            ->orderBy('punched_at')
            ->get();

        $shift = $this->shiftAssignmentResolver->shiftForWorkDate($user, $workDate);

        $checkIn = $logs->first(fn (AttendanceLog $log) => $log->status === AttendanceLogStatus::Hadir);
        $checkOut = $logs->filter(fn (AttendanceLog $log) => $log->status === AttendanceLogStatus::Keluar)->last();
        $hasAbsen = $logs->contains(fn (AttendanceLog $log) => $log->status === AttendanceLogStatus::Absen);

        $presence = $this->resolvePresence($logs, $checkIn, $checkOut, $hasAbsen, $workDate, $allowAbsentMarking);
        $timing = null;
        $late = 0;
        $early = 0;
        $overtime = 0;

        if ($presence === AttendancePresenceStatus::Hadir && $shift !== null && $checkIn !== null && $checkOut !== null) {
            [$late, $early, $overtime] = $this->calculateMinutes($shift, $workDate, $checkIn->punched_at, $checkOut->punched_at);
            $timing = $this->resolveTimingStatus($late, $early, $overtime);
        }

        return AttendanceDay::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'work_date' => $workDate->toDateString(),
            ],
            [
                'company_id' => $user->company_id,
                'shift_id' => $shift?->id,
                'check_in_at' => $checkIn?->punched_at,
                'check_out_at' => $checkOut?->punched_at,
                'presence_status' => $presence,
                'timing_status' => $timing,
                'late_minutes' => $late,
                'early_leave_minutes' => $early,
                'overtime_minutes' => $overtime,
                'computed_at' => now(),
            ],
        );
    }

    /**
     * @param  Collection<int, AttendanceLog>  $logs
     */
    protected function resolvePresence(
        Collection $logs,
        ?AttendanceLog $checkIn,
        ?AttendanceLog $checkOut,
        bool $hasAbsen,
        CarbonImmutable $workDate,
        bool $allowAbsentMarking,
    ): AttendancePresenceStatus {
        if ($hasAbsen) {
            return AttendancePresenceStatus::Absen;
        }

        if ($checkIn !== null && $checkOut !== null) {
            return AttendancePresenceStatus::Hadir;
        }

        if ($checkIn !== null || $checkOut !== null) {
            return AttendancePresenceStatus::TidakLengkap;
        }

        if ($allowAbsentMarking && $this->shouldMarkAbsent($workDate)) {
            return AttendancePresenceStatus::TidakHadir;
        }

        return AttendancePresenceStatus::TidakLengkap;
    }

    protected function shouldMarkAbsent(CarbonImmutable $workDate): bool
    {
        $now = CarbonImmutable::now($this->timezone);
        $cutoff = $workDate->setTime(9, 0);

        return $now->gte($cutoff);
    }

    /**
     * @return array{0: int, 1: int, 2: int}
     */
    protected function calculateMinutes(
        Shift $shift,
        CarbonImmutable $workDate,
        CarbonImmutable $checkInAt,
        CarbonImmutable $checkOutAt,
    ): array {
        [$shiftStart, $shiftEnd] = $this->workDateResolver->shiftBounds($shift, $workDate);
        $graceEnd = $shiftStart->addMinutes($shift->grace_minutes);

        $late = $checkInAt->greaterThan($graceEnd)
            ? (int) $graceEnd->diffInMinutes($checkInAt)
            : 0;

        $early = $checkOutAt->lessThan($shiftEnd)
            ? (int) $checkOutAt->diffInMinutes($shiftEnd)
            : 0;

        $overtime = $checkOutAt->greaterThan($shiftEnd)
            ? (int) $shiftEnd->diffInMinutes($checkOutAt)
            : 0;

        return [$late, $early, $overtime];
    }

    protected function resolveTimingStatus(int $late, int $early, int $overtime): AttendanceTimingStatus
    {
        $flags = (int) ($late > 0) + (int) ($early > 0) + (int) ($overtime > 0);

        if ($flags === 0) {
            return AttendanceTimingStatus::OnTime;
        }

        if ($flags > 1) {
            return AttendanceTimingStatus::Mixed;
        }

        if ($late > 0) {
            return AttendanceTimingStatus::Late;
        }

        if ($early > 0) {
            return AttendanceTimingStatus::EarlyLeave;
        }

        return AttendanceTimingStatus::Overtime;
    }
}
