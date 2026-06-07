<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicDashboardPageResource;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
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

        $users = $this->users->activeForDashboard($dateTo->toDateString(), $companyId);

        return Inertia::render(
            'public-dashboard',
            PublicDashboardPageResource::make([
                'users' => $users,
                'attendanceDate' => $dateTo,
                'today' => $today,
                'shiftResolver' => $shiftResolver,
                'tickets' => $this->tickets->paginateLatest($dateFrom, $dateTo, $companyId, 10),
                'engineers' => $this->tickets->engineerSummaries($dateFrom, $dateTo, $companyId),
                'ticketStats' => $this->tickets->globalStats($dateFrom, $dateTo, $companyId),
                'companies' => $this->companies->all(),
                'filters' => [
                    'company_id' => $companyId,
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'defaults' => [
                        'company_id' => null,
                        'date_from' => $today->toDateString(),
                        'date_to' => $today->toDateString(),
                    ],
                ],
            ])->resolve()
        );
    }
}
