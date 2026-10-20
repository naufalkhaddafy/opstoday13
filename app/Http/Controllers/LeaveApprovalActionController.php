<?php

namespace App\Http\Controllers;

use App\Http\Requests\LeaveApprovalDecisionRequest;
use App\Http\Resources\LeaveApprovalActionResource;
use App\Models\UserLeaveApproval;
use App\Services\Leave\LeaveApprovalDecisionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class LeaveApprovalActionController extends Controller
{
    public function show(Request $request, UserLeaveApproval $approval, string $action, LeaveApprovalDecisionService $decisions)
    {
        Gate::authorize('emailAction', $approval);
        $token = $request->query('token');
        $error = is_string($token) && strlen($token) === 64
            ? $decisions->tokenError($approval, $token) : 'This approval link is invalid.';

        return Inertia::render('leaves/email-action', (new LeaveApprovalActionResource([
            'approval' => $approval, 'error' => $error,
        ]))->resolve($request))->toResponse($request)
            ->header('Referrer-Policy', 'no-referrer')->header('Cache-Control', 'no-store, private');
    }

    public function store(LeaveApprovalDecisionRequest $request, UserLeaveApproval $approval, string $action, LeaveApprovalDecisionService $decisions)
    {
        $data = $request->validated();
        $decisions->decide($approval, $request->user(), $action, $data['rejection_reason'] ?? null, $data['token']);

        return to_route($action === 'approve' ? 'leave-approval-actions.result' : 'leaves.index', $action === 'approve' ? ['approval' => $approval->id] : [])->with('toast', [
            'type' => 'success', 'message' => $action === 'approve' ? 'Leave request approved.' : 'Leave request rejected.',
        ]);
    }

    public function result(Request $request, UserLeaveApproval $approval)
    {
        Gate::authorize('emailAction', $approval);
        abort_unless($approval->status === 'approved', 404);

        return Inertia::render('leaves/email-action', (new LeaveApprovalActionResource([
            'approval' => $approval, 'error' => null, 'completed' => true,
        ]))->resolve($request))->toResponse($request)
            ->header('Referrer-Policy', 'no-referrer')->header('Cache-Control', 'no-store, private');
    }
}
