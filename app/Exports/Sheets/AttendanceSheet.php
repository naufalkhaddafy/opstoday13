<?php

namespace App\Exports\Sheets;

use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Attendance\DailyAttendanceSummarizer;
use App\Services\Attendance\ShiftAssignmentResolver;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class AttendanceSheet implements FromArray, WithTitle, WithHeadings
{
    private $dateFrom;
    private $dateTo;
    private $companyId;

    public function __construct($dateFrom, $dateTo, $companyId)
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->companyId = $companyId;
    }

    public function array(): array
    {
        $usersRepo = app(UserRepositoryInterface::class);
        $shiftResolver = app(ShiftAssignmentResolver::class);
        $summarizer = new DailyAttendanceSummarizer();

        $users = $usersRepo->activeForDashboard($this->dateFrom->toDateString(), $this->dateTo->toDateString(), $this->companyId);
        
        $result = $summarizer->summarize($users, $this->dateFrom, $this->dateTo, $shiftResolver);
        
        $rows = [];
        foreach ($result['employees'] as $emp) {
            $rows[] = [
                $emp['id'],
                $emp['name'],
                $emp['shift_name'] . ' (' . $emp['shift_time'] . ')',
                $emp['status'] ?? '-',
                $emp['check_in'] ?? '-',
                $emp['check_out'] ?? '-',
                $emp['late_minutes'] ?? 0,
                $emp['early_leave_minutes'] ?? 0,
                $emp['extended_minutes'] ?? 0,
                $emp['period_stats']['present_days'] ?? 0,
                $emp['period_stats']['absent_days'] ?? 0,
                $emp['period_stats']['sick_days'] ?? 0,
                $emp['period_stats']['permit_days'] ?? 0,
                $emp['period_stats']['leave_days'] ?? 0,
            ];
        }
        return $rows;
    }

    public function headings(): array
    {
        return [
            'User ID',
            'Name',
            'Shift',
            'Today Status',
            'Today Check In',
            'Today Check Out',
            'Today Late (Min)',
            'Today Early Leave (Min)',
            'Today Extended (Min)',
            'Period Present Days',
            'Period Absent Days',
            'Period Sick Days',
            'Period Permit Days',
            'Period Leave Days',
        ];
    }

    public function title(): string
    {
        return 'Attendance Summary';
    }
}
