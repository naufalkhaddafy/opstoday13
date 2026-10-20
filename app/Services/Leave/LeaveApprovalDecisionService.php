<?php

namespace App\Services\Leave;

use App\Jobs\SendLeaveNotificationJob;
use App\Models\User;
use App\Models\UserLeaveApproval;
use App\Repositories\Contracts\LeaveApprovalRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class LeaveApprovalDecisionService
{
    public function __construct(private LeaveApprovalRepositoryInterface $approvals) {}

    public function tokenError(UserLeaveApproval $approval, string $token): ?string
    {
        if (! $approval->email_token_hash || ! hash_equals($approval->email_token_hash, hash('sha256', $token))) {
            return 'This approval link is invalid or has been replaced by a newer email.';
        }

        if ($approval->email_token_used_at || $approval->status !== 'pending' || $approval->leave->status !== 'pending') {
            return 'This approval has already been processed or closed.';
        }

        if (! $approval->email_token_expires_at || $approval->email_token_expires_at->isPast()) {
            return 'This approval link has expired. Please use the pending approvals page.';
        }

        return null;
    }

    public function decide(UserLeaveApproval $approval, User $user, string $action, ?string $reason = null, ?string $token = null): void
    {
        DB::transaction(function () use ($approval, $user, $action, $reason, $token) {
            $leave = $this->approvals->lockLeave($approval->user_leave_id);
            $task = $this->approvals->lockApproval($approval->id);
            $task->setRelation('leave', $leave);
            Gate::forUser($user)->authorize($token === null ? 'decide' : 'emailAction', $task);

            $error = $token === null ? null : $this->tokenError($task, $token);
            if ($error || $task->status !== 'pending' || $leave->status !== 'pending') {
                throw ValidationException::withMessages(['token' => $error ?? 'This approval has already been processed or closed.']);
            }

            $task->update([
                'status' => $action === 'approve' ? 'approved' : 'rejected',
                'approved_at' => now(),
                'rejection_reason' => $action === 'reject' ? $reason : null,
                'email_token_used_at' => now(),
            ]);

            $rule = $leave->user?->company?->resolveLeaveApprovalRule($leave->user->group_id) ?? [];
            $requirement = $rule['requirement'] ?? 'any';
            $workflow = $rule['workflow_type'] ?? 'parallel';

            if ($action === 'reject') {
                $leave->update(['status' => 'rejected']);
                $this->approvals->closeRemaining($leave);
                SendLeaveNotificationJob::dispatch($leave, 'rejected', $leave->user)->afterCommit();
            } elseif ($requirement === 'any' || $this->approvals->allApproved($leave)) {
                $leave->update(['status' => 'approved']);
                $this->approvals->closeRemaining($leave);
                SendLeaveNotificationJob::dispatch($leave, 'approved', $leave->user)->afterCommit();
            } elseif ($workflow === 'sequential') {
                $next = $this->approvals->nextWaiting($leave);
                if ($next) {
                    $next->update(['status' => 'pending']);
                    SendLeaveNotificationJob::dispatch($leave, 'new_request', $next->approver)->afterCommit();
                }
            }
        }, 3);
    }
}
