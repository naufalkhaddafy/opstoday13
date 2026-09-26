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

        // PERFORMANCE OPTIMIZATION:
        // 1. We EXCLUDE the massive `output` and `metadata` columns from the main query 
        //    to prevent severe memory exhaustion and bandwidth bloat on the frontend.
        //    They are fetched on-demand via the show() API method when viewing details.
        // 2. We use simplePaginate() instead of paginate() to bypass the extremely slow 
        //    COUNT(*) query on large tables (e.g. 230k+ rows).
        $logs = $query
            ->select('id', 'command', 'status', 'started_at', 'duration')
            ->simplePaginate(50)
            ->withQueryString();

        return Inertia::render('admin/schedule-logs/index', [
            'logs' => $logs,
            'filters' => $request->only(['command', 'status', 'date']),
        ]);
    }

    public function show($id)
    {
        return response()->json(ScheduleLog::findOrFail($id));
    }
}
