<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeaveApprovalDecisionRequest;
use App\Http\Resources\LeaveApprovalResource;
use App\Models\UserLeaveApproval;
use App\Repositories\Contracts\LeaveApprovalRepositoryInterface;
use App\Services\Leave\LeaveApprovalDecisionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveApprovalController extends Controller
{
    public function index(Request $request, LeaveApprovalRepositoryInterface $approvals)
    {
        return Inertia::render('admin/leave-approvals/index', [
            'approvals' => LeaveApprovalResource::collection($approvals->pendingForUser($request->user()->id))->resolve($request),
        ]);
    }

    public function approve(LeaveApprovalDecisionRequest $request, UserLeaveApproval $approval, LeaveApprovalDecisionService $decisions)
    {
        $decisions->decide($approval, $request->user(), 'approve');

        return redirect()->back()->with('toast', ['type' => 'success', 'message' => 'Leave request approved.']);
    }

    public function reject(LeaveApprovalDecisionRequest $request, UserLeaveApproval $approval, LeaveApprovalDecisionService $decisions)
    {
        $decisions->decide($approval, $request->user(), 'reject', $request->validated('rejection_reason'));

        return redirect()->back()->with('toast', ['type' => 'success', 'message' => 'Leave request rejected.']);
    }
}
