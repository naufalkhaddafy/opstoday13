<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'total_off_days' => 0,
        ];
        
        for ($day = 1; $day <= $totalDays; $day++) {
            $date = $startOfMonth->setDay($day);
            $dateString = $date->toDateString();
            
            // Check active shift assignment
            $assignment = $shiftResolver->forWorkDate($user, $date);
            $shift = $assignment?->shift;
            $isWorkday = $assignment !== null && $assignment->isActiveOn($date);
            
            $dbRecord = $attendanceDays->get($dateString);
            
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
                    $summary['total_incomplete']++;
                    $summary['total_scheduled']++;
                } elseif ($presence === 'absen' || $presence === 'tidak_hadir') {
                    $summary['total_absent']++;
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
            } else {
                // If no DB record exists
                if ($isWorkday) {
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
                'timing_status' => $timing,
                'late_minutes' => $lateMinutes,
                'early_leave_minutes' => $earlyMinutes,
                'overtime_minutes' => $overtimeMinutes,
            ];
        }
        
        $today = \Carbon\CarbonImmutable::now($timezone);
        $currentAssignment = $shiftResolver->forWorkDate($user, $today);
        $currentShift = $currentAssignment?->shift;
        
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
                'days' => $currentAssignment->days_of_week,
            ] : null,
            'filters' => [
                'month' => $month,
                'year' => $year,
            ]
        ];
    }
}
