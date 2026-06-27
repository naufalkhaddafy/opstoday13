<?php

namespace App\Services\Attendance;

use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use App\Repositories\Contracts\HolidayRepositoryInterface;

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
    public function summarize(Collection $users, CarbonImmutable $dateFrom, CarbonImmutable $dateTo, ShiftAssignmentResolver $shiftResolver): array
    {
        $timezone = config('app.timezone');
        $period = CarbonPeriod::create($dateFrom, $dateTo);

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
            $periodStats = [
                'present_days' => 0,
                'leave_days' => 0,
                'sick_days' => 0,
                'permit_days' => 0,
                'absent_days' => 0,
                'scheduled_days' => 0,
                'scheduled_working_days' => 0,
                'late_minutes' => 0,
                'early_leave_minutes' => 0,
                'extended_minutes' => 0,
            ];

            // Default for the last day (for badge)
            $lastDayStatus = 'off_day';
            $lastDayCheckIn = null;
            $lastDayCheckOut = null;
            $lastDayLeaveDesc = null;
            $lastDayShift = null;
            $lastDayLate = 0;
            $lastDayEarly = 0;
            $lastDayExtended = 0;
            
            $dailyDetails = [];

            foreach ($period as $date) {
                $immutableDate = CarbonImmutable::instance($date);
                
                $activeLeave = $user->leaves->firstWhere(fn($leave) => $immutableDate->between($leave->start_date, $leave->end_date));
                $assignment = $shiftResolver->forWorkDate($user, $immutableDate);
                $shift = $shiftResolver->shiftForWorkDate($user, $immutableDate);
                $isScheduled = $shift !== null;
                $attendanceDay = $user->attendanceDays->firstWhere(function($day) use ($immutableDate) {
                    if (is_string($day->work_date)) {
                        return $immutableDate->toDateString() === $day->work_date;
                    }
                    return $immutableDate->isSameDay($day->work_date);
                });

                $dayStatus = 'off_day';
                $dayLeaveDesc = null;
                $dayCheckIn = null;
                $dayCheckOut = null;
                $dayLate = 0;
                $dayEarly = 0;
                $dayExtended = 0;

                if ($isScheduled) {
                    $periodStats['scheduled_days']++;
                }

                if ($activeLeave) {
                    $dayStatus = $activeLeave->type;
                    $dayLeaveDesc = $activeLeave->description;
                    
                    if ($dayStatus === 'cuti') {
                        $periodStats['leave_days']++;
                    } elseif ($dayStatus === 'sakit') {
                        $periodStats['sick_days']++;
                    } elseif ($dayStatus === 'izin') {
                        $periodStats['permit_days']++;
                    } else {
                        $periodStats['leave_days']++; // Fallback
                    }

                    $stats['total_leave']++;
                } elseif ($isScheduled || $attendanceDay) {
                    if ($isScheduled) {
                        $periodStats['scheduled_working_days']++;
                    }
                    if ($isScheduled) {
                        $stats['total_scheduled']++;
                    }

                    if ($attendanceDay) {
                        $dayStatus = $attendanceDay->presence_status->value;
                        $dayCheckIn = $attendanceDay->check_in_at ? Carbon::parse($attendanceDay->check_in_at)->timezone($timezone)->format('H:i') : null;
                        $dayCheckOut = $attendanceDay->check_out_at ? Carbon::parse($attendanceDay->check_out_at)->timezone($timezone)->format('H:i') : null;
                        $dayLate = $attendanceDay->late_minutes ?? 0;
                        $dayEarly = $attendanceDay->early_leave_minutes ?? 0;
                        $dayExtended = $attendanceDay->overtime_minutes ?? 0;

                        if (in_array($dayStatus, ['hadir', 'tidak_lengkap'])) {
                            if ($isScheduled) {
                                $stats['total_present']++;
                            }
                            $periodStats['present_days']++;
                            
                            $periodStats['late_minutes'] += $dayLate;
                            $periodStats['early_leave_minutes'] += $dayEarly;
                            $periodStats['extended_minutes'] += $dayExtended;

                            if ($dayLate > 0 && $isScheduled) {
                                $stats['total_late']++;
                            }
                            if ($dayEarly > 0 && $isScheduled) {
                                $stats['total_early_leave']++;
                            }
                        } elseif (in_array($dayStatus, ['sakit'])) {
                            $periodStats['sick_days']++;
                            if ($isScheduled) $stats['total_absent']++;
                        } elseif (in_array($dayStatus, ['izin'])) {
                            $periodStats['permit_days']++;
                            if ($isScheduled) $stats['total_absent']++;
                        } elseif (in_array($dayStatus, ['cuti'])) {
                            $periodStats['leave_days']++;
                            if ($isScheduled) $stats['total_leave']++;
                        } elseif (in_array($dayStatus, ['absen', 'tidak_hadir'])) {
                            $periodStats['absent_days']++;
                            if ($isScheduled) $stats['total_absent']++;
                        }
                    } else {
                        $dayStatus = 'absen';
                        $periodStats['absent_days']++;
                        if ($isScheduled) $stats['total_absent']++;
                    }
                } else {
                    $holidayName = app(HolidayRepositoryInterface::class)->getHolidayName($immutableDate->toDateString());
                    if ($holidayName !== null) {
                        $dayStatus = 'holiday';
                        $dayLeaveDesc = $holidayName . ' (' . $immutableDate->translatedFormat('l') . ')';
                    }
                }

                $dailyDetails[$date->toDateString()] = [
                    'status' => $dayStatus,
                ];

                // If this is the last day of the period, save for badge
                if ($date->isSameDay($dateTo)) {
                    $lastDayStatus = $dayStatus;
                    $lastDayCheckIn = $dayCheckIn;
                    $lastDayCheckOut = $dayCheckOut;
                    $lastDayLeaveDesc = $dayLeaveDesc;
                    $lastDayShift = $shift;
                    $lastDayLate = $dayLate;
                    $lastDayEarly = $dayEarly;
                    $lastDayExtended = $dayExtended;
                }
            }

            $employees[] = [
                'id' => $user->id,
                'name' => $user->name,
                'shift_name' => $lastDayShift?->name ?? 'Libur',
                'shift_time' => $lastDayShift ? substr($lastDayShift->start_time, 0, 5).' - '.substr($lastDayShift->end_time, 0, 5) : '-',
                'status' => $lastDayStatus,
                'check_in' => $lastDayCheckIn,
                'check_out' => $lastDayCheckOut,
                'leave_description' => $lastDayLeaveDesc,
                'late_minutes' => $lastDayLate,
                'early_leave_minutes' => $lastDayEarly,
                'extended_minutes' => $lastDayExtended,
                'period_stats' => $periodStats,
                'daily_details' => $dailyDetails,
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
