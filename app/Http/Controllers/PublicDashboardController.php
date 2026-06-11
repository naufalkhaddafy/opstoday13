<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicDashboardPageResource;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Attendance\AttendanceAnalyticsService;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicDashboardController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly TicketDashboardRepositoryInterface $tickets,
        private readonly CompanyRepositoryInterface $companies,
        private readonly AttendanceAnalyticsService $analyticsService,
    ) {}

    /**
     * Dashboard publik (tanpa login): ringkasan kehadiran & operasional tiket IT.
     */
    public function index(Request $request, ShiftAssignmentResolver $shiftResolver): Response
    {
        $timezone = config('app.timezone');
        $today = CarbonImmutable::now($timezone)->startOfDay();

        // No redirect needed – defaults are resolved inline so the URL stays clean as '/'.


        $dateFrom = CarbonImmutable::parse(
            $request->input('date_from', $today->toDateString()),
            $timezone,
        )->startOfDay();

        $dateTo = CarbonImmutable::parse(
            $request->input('date_to', $today->toDateString()),
            $timezone,
        )->startOfDay();

        if ($dateFrom->gt($dateTo)) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        $companyInput = $request->input('company_id');
        $companyId = $companyInput && $companyInput !== 'all' ? (int) $companyInput : null;

        $search = $request->input('search');
        $sortBy = $request->input('sort_by');
        $sortDir = $request->input('sort_dir', 'desc');
        $status = $request->input('status');

        return Inertia::render(
            'public-dashboard',
            PublicDashboardPageResource::make([
                'users' => fn () => $this->users->activeForDashboard($dateFrom->toDateString(), $dateTo->toDateString(), $companyId),
                'attendanceDate' => $dateTo,
                'today' => $today,
                'shiftResolver' => $shiftResolver,
                'tickets' => fn () => $this->tickets->paginateLatest($dateFrom, $dateTo, $companyId, 10, $search, $sortBy, $sortDir, $status),
                'engineers' => fn () => $this->tickets->engineerSummaries($dateFrom, $dateTo, $companyId),
                'ticketStats' => fn () => $this->tickets->globalStats($dateFrom, $dateTo, $companyId),
                'kpiStats' => fn () => $this->tickets->kpiStats($dateFrom, $dateTo, $companyId),
                'analytics' => fn () => [
                    'leaderboard' => $this->analyticsService->getDisciplineLeaderboard($dateFrom, $dateTo, $companyId),
                    'lateTrend' => $this->analyticsService->getLateTrend($dateFrom, $dateTo, $companyId),
                ],
                'companies' => $this->companies->all(),
                'filters' => [
                    'company_id' => $companyId,
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'search' => $search,
                    'sort_by' => $sortBy,
                    'sort_dir' => $sortDir,
                    'status' => $status,
                    'defaults' => [
                        'company_id' => null,
                        'date_from' => $today->toDateString(),
                        'date_to' => $today->toDateString(),
                        'search' => null,
                        'sort_by' => null,
                        'sort_dir' => 'desc',
                        'status' => null,
                    ],
                ],
            ])->resolve()
        );
    }

    public function export(Request $request)
    {
        $timezone = config('app.timezone');
        $today = CarbonImmutable::now($timezone)->startOfDay();

        $dateFrom = CarbonImmutable::parse(
            $request->input('date_from', $today->toDateString()),
            $timezone,
        )->startOfDay();

        $dateTo = CarbonImmutable::parse(
            $request->input('date_to', $today->toDateString()),
            $timezone,
        )->startOfDay();

        if ($dateFrom->gt($dateTo)) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        $companyInput = $request->input('company_id');
        $companyId = $companyInput && $companyInput !== 'all' ? (int) $companyInput : null;

        $search = $request->input('search');
        $status = $request->input('status');

        return (new \App\Exports\DashboardExport($dateFrom, $dateTo, $companyId, $search, $status))->download('dashboard-export.xlsx');
    }
}
