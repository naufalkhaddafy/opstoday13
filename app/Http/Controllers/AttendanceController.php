<?php

namespace App\Http\Controllers;

use App\Http\Resources\Admin\UserAttendancePageResource;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UserAttendanceExport;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceDayRepositoryInterface $attendanceDays,
    ) {}

    /**
     * Tampilkan detail rekap absensi harian & KPI bulanan user (personal).
     */
    public function index(Request $request, ShiftAssignmentResolver $shiftResolver): Response
    {
        $timezone = config('app.timezone');
        $user = Auth::user();
        
        $year = (int) $request->input('year', now($timezone)->year);
        $month = (int) $request->input('month', now($timezone)->month);
        
        $startOfMonth = CarbonImmutable::create($year, $month, 1, 0, 0, 0, $timezone);
        $endOfMonth = $startOfMonth->endOfMonth();
        
        $days = $this->attendanceDays->getForUserInDateRange($user, $startOfMonth, $endOfMonth)
            ->keyBy(fn ($record) => $record->work_date->toDateString());
            
        return Inertia::render(
            'attendance/index',
            UserAttendancePageResource::make([
                'user' => $user,
                'attendance_days' => $days,
                'month' => $month,
                'year' => $year,
                'shift_resolver' => $shiftResolver,
            ])->resolve($request)
        );
    }

    /**
     * Export detail rekap absensi harian user (personal) ke Excel.
     */
    public function export(Request $request, ShiftAssignmentResolver $shiftResolver)
    {
        $timezone = config('app.timezone');
        $user = Auth::user();
        
        $year = (int) $request->input('year', now($timezone)->year);
        $month = (int) $request->input('month', now($timezone)->month);
        
        $startOfMonth = CarbonImmutable::create($year, $month, 1, 0, 0, 0, $timezone);
        $endOfMonth = $startOfMonth->endOfMonth();
        
        $days = $this->attendanceDays->getForUserInDateRange($user, $startOfMonth, $endOfMonth)
            ->keyBy(fn ($record) => $record->work_date->toDateString());
            
        $resource = UserAttendancePageResource::make([
            'user' => $user,
            'attendance_days' => $days,
            'month' => $month,
            'year' => $year,
            'shift_resolver' => $shiftResolver,
        ])->resolve($request);

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $monthName = $monthNames[$month] ?? '';

        $fileName = "My_Attendance_{$monthName}_{$year}.xlsx";

        return Excel::download(new UserAttendanceExport($resource['attendance_logs'], $user->name, $monthName, $year), $fileName);
    }
}
