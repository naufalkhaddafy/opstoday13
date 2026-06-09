<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\ActivityLogPageResource;
use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function __construct(
        protected ActivityLogRepositoryInterface $activityLogRepository
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $logs = $this->activityLogRepository->getPaginatedLogs(15, $search);

        return Inertia::render('admin/activity-logs/index', [
            'logs' => ActivityLogPageResource::collection($logs),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
}
