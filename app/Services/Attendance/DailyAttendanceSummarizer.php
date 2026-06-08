<?php

namespace App\Services\Attendance;

use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Hitung ringkasan kehadiran harian per user (status, jam, KPI agregat).
 *
 * Dipakai bersama oleh dashboard internal (auth) dan dashboard publik agar
 * logika penentuan status tidak terduplikasi.
 */
class DailyAttendanceSummarizer
{
    /**
     * @param  Collection<int, User>  $users
     * @return array{stats: array<string, int>, employees: array<int, array<string, mixed>>}
     */
    public function summarize(Collection $users, CarbonImmutable $today, ShiftAssignmentResolver $shiftResolver): array
    {
        $timezone = config('app.timezone');

        $stats = [
            'total_users' => $users->count(),
            'total_scheduled' => 0,
            'total_present' => 0,
            'total_leave' => 0,
            'total_absent' => 0,
            'total_late' => 0,
            'total_early_leave' => 0,
        ];

        $employees = [];

        foreach ($users as $user) {
            $activeLeave = $user->leaves->first();
            $assignment = $shiftResolver->forWorkDate($user, $today);
            $shift = $shiftResolver->shiftForWorkDate($user, $today);

            $isScheduled = $assignment !== null && $assignment->isActiveOn($today);
            $attendanceDay = $user->attendanceDays->first();

            $status = 'off_day';
            $checkIn = null;
            $checkOut = null;
            $lateMinutes = 0;
            $earlyLeaveMinutes = 0;
            $overtimeMinutes = 0;
            $leaveDesc = null;

            if ($activeLeave) {
                $status = $activeLeave->type;
                $leaveDesc = $activeLeave->description;
                $stats['total_leave']++;
            } elseif ($isScheduled) {
                $stats['total_scheduled']++;

                if ($attendanceDay) {
                    $status = $attendanceDay->presence_status->value;
                    $checkIn = $attendanceDay->check_in_at ? Carbon::parse($attendanceDay->check_in_at)->timezone($timezone)->format('H:i') : null;
                    $checkOut = $attendanceDay->check_out_at ? Carbon::parse($attendanceDay->check_out_at)->timezone($timezone)->format('H:i') : null;
                    $lateMinutes = $attendanceDay->late_minutes ?? 0;
                    $earlyLeaveMinutes = $attendanceDay->early_leave_minutes ?? 0;
                    $overtimeMinutes = $attendanceDay->overtime_minutes ?? 0;

                    if (in_array($status, ['hadir', 'tidak_lengkap'])) {
                        $stats['total_present']++;
                        if ($lateMinutes > 0) {
                            $stats['total_late']++;
                        }
                        if ($earlyLeaveMinutes > 0) {
                            $stats['total_early_leave']++;
                        }
                    } elseif (in_array($status, ['absen', 'tidak_hadir'])) {
                        $stats['total_absent']++;
                    }
                } else {
                    $status = 'absen';
                    $stats['total_absent']++;
                }
            }

            $employees[] = [
                'id' => $user->id,
                'name' => $user->name,
                'shift_name' => $shift?->name ?? 'Libur',
                'shift_time' => $shift ? substr($shift->start_time, 0, 5).' - '.substr($shift->end_time, 0, 5) : '-',
                'status' => $status,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'late_minutes' => $lateMinutes,
                'early_leave_minutes' => $earlyLeaveMinutes,
                'extended_minutes' => $overtimeMinutes,
                'leave_description' => $leaveDesc,
            ];
        }

        usort($employees, function ($a, $b) {
            $order = [
                'hadir' => 1,
                'tidak_lengkap' => 2,
                'sakit' => 3,
                'izin' => 4,
                'cuti' => 5,
                'absen' => 6,
                'tidak_hadir' => 7,
                'off_day' => 8,
            ];

            $weightA = $order[$a['status']] ?? 99;
            $weightB = $order[$b['status']] ?? 99;

            if ($weightA === $weightB) {
                return strcmp($a['name'], $b['name']);
            }

            return $weightA <=> $weightB;
        });

        return [
            'stats' => $stats,
            'employees' => $employees,
        ];
    }
}
