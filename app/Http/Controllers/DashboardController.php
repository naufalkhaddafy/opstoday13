<?php

namespace App\Http\Controllers;

use App\Http\Resources\DashboardPageResource;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    public function index(Request $request, ShiftAssignmentResolver $shiftResolver): Response
    {
        $timezone = config('app.timezone');
        $today = CarbonImmutable::now($timezone)->startOfDay();

        $users = $this->users->activeForDashboard($today->toDateString());

        return Inertia::render(
            'dashboard',
            DashboardPageResource::make([
                'users' => $users,
                'today' => $today,
                'shiftResolver' => $shiftResolver,
            ])->resolve()
        );
    }
}
