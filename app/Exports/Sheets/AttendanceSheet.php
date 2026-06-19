<?php

namespace App\Exports\Sheets;

use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Attendance\DailyAttendanceSummarizer;
use App\Services\Attendance\ShiftAssignmentResolver;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class AttendanceSheet implements FromView, WithTitle, ShouldAutoSize
{
    private $dateFrom;
    private $dateTo;
    private $companyId;
    private $companyName;

    public function __construct($dateFrom, $dateTo, $companyId, $companyName = null)
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->companyId = $companyId;
        $this->companyName = $companyName;
    }

    public function view(): View
    {
        $usersRepo = app(UserRepositoryInterface::class);
        $shiftResolver = app(ShiftAssignmentResolver::class);
        $summarizer = new DailyAttendanceSummarizer();

        $users = $usersRepo->activeForDashboard($this->dateFrom->toDateString(), $this->dateTo->toDateString(), $this->companyId);
        
        $result = $summarizer->summarize($users, $this->dateFrom, $this->dateTo, $shiftResolver);
        
        $employees = $result['employees'] ?? [];
        
        $stats = $result['stats'] ?? [];

        return view('exports.public_dashboard.attendance_overview', [
            'employees' => $employees,
            'stats' => $stats,
            'dateFrom' => $this->dateFrom,
            'dateTo' => $this->dateTo,
            'period' => \Carbon\CarbonPeriod::create($this->dateFrom, $this->dateTo),
            'companyName' => $this->companyName,
        ]);
    }

    public function title(): string
    {
        return 'Attendance Overview';
    }
}
