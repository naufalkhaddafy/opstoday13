<?php

namespace App\Services\Attendance;

use App\Enums\AttendanceLogStatus;
use App\Enums\AttendancePresenceStatus;
use App\Enums\AttendanceTimingStatus;
use App\Models\AttendanceDay;
use App\Models\AttendanceLog;
use App\Models\Shift;
use App\Models\User;
use App\Models\UserLeave;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class AttendanceDayAggregator
{
    protected string $timezone;

    public function __construct(
        protected AttendanceWorkDateResolver $workDateResolver,
        protected ShiftAssignmentResolver $shiftAssignmentResolver,
        ?string $timezone = null,
    ) {
        $this->timezone = $timezone ?? config('app.timezone');
    }

    public function rebuildForUserAndDate(User $user, CarbonImmutable $workDate, bool $allowAbsentMarking = true): AttendanceDay
    {
        $workDate = $workDate->timezone($this->timezone)->startOfDay();

        $logs = AttendanceLog::query()
            ->where('user_id', $user->id)
            ->whereDate('work_date', $workDate->toDateString())
            ->orderBy('punched_at')
            ->get();

        $shift = $this->shiftAssignmentResolver->shiftForWorkDate($user, $workDate);

        // Ambil log masuk: cari yang berstatus 'hadir' paling awal, fallback ke log paling pertama hari itu
        $checkIn = $logs->first(fn (AttendanceLog $log) => $log->status === AttendanceLogStatus::Hadir);
        // Jangan jadikan log "Keluar" sebagai "Check In" jika itu satu-satunya log
        if ($checkIn === null && $logs->isNotEmpty() && $logs->first()->status !== AttendanceLogStatus::Keluar) {
            $checkIn = $logs->first();
        }

        // Auto-match: jika shift adalah placeholder generik, cocokkan ke shift riil terdekat
        $placeholderCodes = ['steady', 'shift'];

        // Jika shift kosong (karena libur/jadwal null) tapi ada check in, coba fallback ke logika resolver
        if ($shift === null && $checkIn !== null) {
            $resolved = $this->workDateResolver->resolve($user, $checkIn->punched_at);
            if ($resolved !== null && $resolved['shift'] !== null) {
                $shift = $resolved['shift'];
            }
        }

        if ($shift !== null && in_array($shift->code, $placeholderCodes, true) && $checkIn !== null) {
            $realShifts = Shift::where('type', $shift->type)
                ->whereNotIn('code', $placeholderCodes)
                ->get();

            $matchingShifts = [];
            foreach ($realShifts as $realShift) {
                [$start, $end] = $realShift->windowForWorkDate($workDate, $this->timezone);
                $diff = abs($checkIn->punched_at->diffInMinutes($start));
                $matchingShifts[] = [
                    'shift' => $realShift,
                    'diff' => $diff,
                ];
            }

            if (! empty($matchingShifts)) {
                usort($matchingShifts, fn ($a, $b) => $a['diff'] <=> $b['diff']);
                $shift = $matchingShifts[0]['shift'];
            }
        }

        // Ambil log keluar: cari yang berstatus 'keluar' paling akhir
        $checkOut = $logs->filter(fn (AttendanceLog $log) => $log->status === AttendanceLogStatus::Keluar)->last();

        $hasAbsen = $logs->contains(fn (AttendanceLog $log) => $log->status === AttendanceLogStatus::Absen);

        $presence = $this->resolvePresence($user, $logs, $checkIn, $checkOut, $hasAbsen, $workDate, $allowAbsentMarking);
        $timing = null;
        $late = 0;
        $early = 0;
        $overtime = 0;

        if ($shift !== null && $checkIn !== null) {
            [$late, $early, $overtime] = $this->calculateMinutes($shift, $workDate, $checkIn->punched_at, $checkOut?->punched_at);
            if ($checkOut !== null && $presence === AttendancePresenceStatus::Hadir) {
                $timing = $this->resolveTimingStatus($late, $early, $overtime);
            }
        }

        // Safeguard 1: Jika user hanya melakukan tap OUT tanpa tap IN, pastikan metrik 0
        // Tap OUT dibiarkan tetap ada agar HR bisa melihat jam pulangnya.
        if ($checkIn === null && $checkOut !== null) {
            $late = 0;
            $early = 0;
            $overtime = 0;
        }

        // Safeguard 2: Jika user salah tap, misalnya tap OUT sebelum tap IN (checkOut < checkIn)
        // ATAU tap IN dan tap OUT dalam waktu yang sangat berdekatan (<= 5 menit),
        // maka abaikan checkOut dan reset kalkulasi.
        if ($checkIn !== null && $checkOut !== null) {
            $duration = $checkIn->punched_at->diffInMinutes($checkOut->punched_at);
            $isInvalidSequence = $checkOut->punched_at->lt($checkIn->punched_at);
            
            if ($isInvalidSequence || $duration <= 5) {
                $checkOut = null;
                $timing = null;
                $late = 0;
                $early = 0;
                $overtime = 0;
                // Ubah presence menjadi Tidak Lengkap karena out-nya dihapus
                $presence = AttendancePresenceStatus::TidakLengkap;
            }
        }

        if ($logs->isEmpty()) {
            $existing = AttendanceDay::query()
                ->where('user_id', $user->id)
                ->where('work_date', $workDate->toDateString())
                ->first();
                
            if ($existing) {
                $existing->delete();
            }
            
            return new AttendanceDay();
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
        User $user,
        Collection $logs,
        ?AttendanceLog $checkIn,
        ?AttendanceLog $checkOut,
        bool $hasAbsen,
        CarbonImmutable $workDate,
        bool $allowAbsentMarking,
    ): AttendancePresenceStatus {
        $activeLeave = UserLeave::query()
            ->where('user_id', $user->id)
            ->approved()
            ->activeOn($workDate->toDateString())
            ->first();

        if ($activeLeave !== null) {
            return match ($activeLeave->type) {
                'sakit' => AttendancePresenceStatus::Sakit,
                'izin' => AttendancePresenceStatus::Izin,
                default => AttendancePresenceStatus::Cuti,
            };
        }

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
        ?CarbonImmutable $checkOutAt,
    ): array {
        [$shiftStart, $shiftEnd] = $this->workDateResolver->shiftBounds($shift, $workDate);

        $checkInAt = $checkInAt->timezone($this->timezone);
        $late = $checkInAt->greaterThan($shiftStart)
            ? (int) $shiftStart->startOfMinute()->diffInMinutes($checkInAt->startOfMinute())
            : 0;

        $early = 0;
        $overtime = 0;

        if ($checkOutAt !== null) {
            $checkOutAt = $checkOutAt->timezone($this->timezone);
            $expectedDuration = (int) $shiftStart->diffInMinutes($shiftEnd);
            
            // Mengabaikan detik agar perhitungan bulat (mencegah case "early 1 menit" padahal tap di menit yang sama)
            $actualDuration = (int) $checkInAt->startOfMinute()->diffInMinutes($checkOutAt->startOfMinute());

            if ($actualDuration < $expectedDuration) {
                $early = $expectedDuration - $actualDuration;
            } elseif ($actualDuration > $expectedDuration) {
                $overtime = $actualDuration - $expectedDuration;
            }
        }

        return [$late, $early, $overtime];
    }

    protected function resolveTimingStatus(int $late, int $early, int $overtime): AttendanceTimingStatus
    {
        // Status Harian murni didasarkan pada total durasi kerja.
        // Meskipun user memiliki $late > 0, jika durasinya pas, statusnya OnTime (Perfect Work).
        
        if ($early > 0) {
            return AttendanceTimingStatus::EarlyLeave;
        }

        if ($overtime > 0) {
            return AttendanceTimingStatus::Overtime;
        }

        return AttendanceTimingStatus::OnTime;
    }
}
