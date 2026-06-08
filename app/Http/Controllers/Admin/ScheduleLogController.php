<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ScheduleLog;
use Inertia\Inertia;

class ScheduleLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ScheduleLog::query()->latest('started_at');

        if ($request->filled('command')) {
            $query->where('command', 'like', '%' . $request->command . '%');
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('started_at', $request->date);
        }

        $logs = $query->paginate(20)->withQueryString();

        return Inertia::render('admin/schedule-logs/index', [
            'logs' => $logs,
            'filters' => $request->only(['command', 'status', 'date']),
        ]);
    }
}
