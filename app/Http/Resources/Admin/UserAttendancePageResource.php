<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Repositories\Contracts\HolidayRepositoryInterface;

class UserAttendancePageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->resource['user'];
        $attendanceDays = $this->resource['attendance_days'];
        $month = $this->resource['month'];
        $year = $this->resource['year'];
        $shiftResolver = $this->resource['shift_resolver'];
        
        $timezone = config('app.timezone');
        
        $startOfMonth = \Carbon\CarbonImmutable::create($year, $month, 1, 0, 0, 0, $timezone);
        $endOfMonth = $startOfMonth->endOfMonth();
        $totalDays = $startOfMonth->daysInMonth;
        
        $holidayRepo = app(HolidayRepositoryInterface::class);
        
        $daysInMonth = [];
        $summary = [
            'total_scheduled' => 0,
            'total_present' => 0,
            'total_incomplete' => 0,
            'total_absent' => 0,
            'total_late_days' => 0,
            'total_late_minutes' => 0,
            'total_early_leave_days' => 0,
            'total_early_leave_minutes' => 0,
            'total_overtime_days' => 0,
            'total_overtime_minutes' => 0,
            'total_off_days' => 0,
            'total_cuti' => 0,
            'total_sakit' => 0,
            'total_izin' => 0,
        ];
        
        $relationsToLoad = [];
        if (! $user->relationLoaded('leaves')) {
            $relationsToLoad['leaves'] = fn($q) => $q->approved();
        }
        if (! $user->relationLoaded('shiftAssignments')) {
            $relationsToLoad[] = 'shiftAssignments';
        }
        if (! $user->relationLoaded('exceptions')) {
            $relationsToLoad[] = 'exceptions';
        }

        if (! empty($relationsToLoad)) {
            $user->load($relationsToLoad);
        }

        $activeLeaves = $user->leaves;

        for ($day = 1; $day <= $totalDays; $day++) {
            $date = $startOfMonth->setDay($day);
            $dateString = $date->toDateString();
            
            // Check active shift assignment
            $assignment = $shiftResolver->forWorkDate($user, $date);
            $shift = $shiftResolver->shiftForWorkDate($user, $date);
            $isWorkday = $assignment !== null && $assignment->isActiveOn($date);
            $isHoliday = $holidayRepo->isHoliday($dateString);
            
            $dbRecord = $attendanceDays->get($dateString);
            
            // Check active leave for this day
            $activeLeave = $activeLeaves->first(function ($l) use ($dateString) {
                return $l->start_date->toDateString() <= $dateString && $l->end_date->toDateString() >= $dateString;
            });

            $checkIn = null;
            $checkOut = null;
            $presence = 'off_day'; // Default
            $timing = null;
            $lateMinutes = 0;
            $earlyMinutes = 0;
            $overtimeMinutes = 0;
            
            if ($dbRecord) {
                $checkIn = $dbRecord->check_in_at ? \Carbon\CarbonImmutable::parse($dbRecord->check_in_at)->timezone($timezone)->toDateTimeString() : null;
                $checkOut = $dbRecord->check_out_at ? \Carbon\CarbonImmutable::parse($dbRecord->check_out_at)->timezone($timezone)->toDateTimeString() : null;
                $presence = $dbRecord->presence_status->value;
                $timing = $dbRecord->timing_status?->value;
                $lateMinutes = $dbRecord->late_minutes;
                $earlyMinutes = $dbRecord->early_leave_minutes;
                $overtimeMinutes = $dbRecord->overtime_minutes;
                
                // Summarize stats
                if ($presence === 'hadir') {
                    $summary['total_present']++;
                    $summary['total_scheduled']++;
                } elseif ($presence === 'tidak_lengkap') {
                    $summary['total_present']++; // Lupa check out tetap dihitung hadir secara persentase
                    $summary['total_incomplete']++;
                    $summary['total_scheduled']++;
                } elseif ($presence === 'absen' || $presence === 'tidak_hadir') {
                    $summary['total_absent']++;
                    $summary['total_scheduled']++;
                } elseif (in_array($presence, ['cuti', 'sakit', 'izin'])) {
                    $summary["total_{$presence}"]++;
                    $summary['total_scheduled']++;
                }
                
                if ($lateMinutes > 0) {
                    $summary['total_late_days']++;
                    $summary['total_late_minutes'] += $lateMinutes;
                }
                if ($earlyMinutes > 0) {
                    $summary['total_early_leave_days']++;
                    $summary['total_early_leave_minutes'] += $earlyMinutes;
                }
                if ($overtimeMinutes > 0) {
                    $summary['total_overtime_days']++;
                    $summary['total_overtime_minutes'] += $overtimeMinutes;
                }
            } else {
                // If no DB record exists
                if ($activeLeave) {
                    $presence = $activeLeave->type;
                    $summary["total_{$presence}"]++;
                    $summary['total_scheduled']++;
                } elseif ($isHoliday) {
                    $presence = 'holiday';
                    $summary['total_off_days']++;
                } elseif ($isWorkday) {
                    $summary['total_scheduled']++;
                    if ($date->isPast() && !$date->isToday()) {
                        $presence = 'tidak_hadir';
                        $summary['total_absent']++;
                    } else {
                        $presence = 'scheduled';
                    }
                } else {
                    $presence = 'off_day';
                    $summary['total_off_days']++;
                }
            }
            
            $daysInMonth[] = [
                'date' => $dateString,
                'day_of_week' => $date->dayOfWeekIso,
                'day_number' => $day,
                'shift' => $shift ? [
                    'id' => $shift->id,
                    'code' => $shift->code,
                    'name' => $shift->name,
                    'start_time' => substr($shift->start_time, 0, 5),
                    'end_time' => substr($shift->end_time, 0, 5),
                ] : null,
                'check_in_at' => $checkIn,
                'check_out_at' => $checkOut,
                'presence_status' => $presence,
                'is_holiday' => $isHoliday,
                'timing_status' => $timing,
                'late_minutes' => $lateMinutes,
                'early_leave_minutes' => $earlyMinutes,
                'overtime_minutes' => $overtimeMinutes,
            ];
        }
        
        $today = \Carbon\CarbonImmutable::now($timezone);
        $currentAssignment = $shiftResolver->forWorkDate($user, $today);
        $currentShift = $currentAssignment ? $shiftResolver->shiftForWorkDate($user, $today) : null;
        
        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'employee_id' => $user->employee_id,
            ],
            'attendance_logs' => $daysInMonth,
            'summary' => $summary,
            'current_shift' => $currentShift ? [
                'name' => $currentShift->name,
                'code' => $currentShift->code,
                'start_time' => substr($currentShift->start_time, 0, 5),
                'end_time' => substr($currentShift->end_time, 0, 5),
                'days' => (function () use ($currentAssignment) {
                    $days = [];
                    if ($currentAssignment && is_array($currentAssignment->schedule)) {
                        foreach ($currentAssignment->schedule as $day => $val) {
                            if ($val !== null) {
                                $days[] = (int) $day;
                            }
                        }
                    }
                    sort($days);
                    return $days;
                })(),
            ] : (function () use ($currentAssignment) {
                if (! $currentAssignment || ! is_array($currentAssignment->schedule)) {
                    return null;
                }
                $days = [];
                foreach ($currentAssignment->schedule as $day => $val) {
                    if ($val !== null) {
                        $days[] = (int) $day;
                    }
                }
                sort($days);
                if (empty($days)) {
                    return null;
                }
                return [
                    'name' => 'Jadwal Mingguan',
                    'code' => 'Custom',
                    'start_time' => '-',
                    'end_time' => '-',
                    'days' => $days,
                ];
            })(),
            'filters' => [
                'month' => $month,
                'year' => $year,
            ]
        ];
    }
}
