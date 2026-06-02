<?php

namespace App\Http\Controllers;

use App\Enums\RoleName;
use App\Http\Resources\DashboardPageResource;
use App\Models\User;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request, ShiftAssignmentResolver $shiftResolver): Response
    {
        $timezone = config('app.timezone');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        
        $users = User::query()
            ->where('is_active', true)
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', RoleName::SuperAdmin->value))
            ->with([
                'leaves' => fn ($q) => $q->approved()->activeOn($today->toDateString()),
                'shiftAssignments',
                'exceptions' => fn ($q) => $q->whereDate('date', $today->toDateString()),
                'attendanceDays' => fn ($q) => $q->whereDate('work_date', $today->toDateString())
            ])
            ->get();
            
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
