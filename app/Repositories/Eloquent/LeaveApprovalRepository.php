<?php

namespace App\Repositories\Eloquent;

use App\Models\UserLeave;
use App\Models\UserLeaveApproval;
use App\Repositories\Contracts\LeaveApprovalRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class LeaveApprovalRepository implements LeaveApprovalRepositoryInterface
{
    public function lockLeave(int $id): UserLeave
    {
        return UserLeave::query()->lockForUpdate()->findOrFail($id);
    }

    public function lockApproval(int $id): UserLeaveApproval
    {
        return UserLeaveApproval::query()->lockForUpdate()->findOrFail($id);
    }

    public function closeRemaining(UserLeave $leave): void
    {
        $leave->approvals()->whereIn('status', ['pending', 'waiting'])->update([
            'status' => 'closed',
            'email_token_used_at' => now(),
        ]);
    }

    public function nextWaiting(UserLeave $leave): ?UserLeaveApproval
    {
        return $leave->approvals()->where('status', 'waiting')->orderBy('step_order')->first();
    }

    public function pendingForUser(int $userId): Collection
    {
        return UserLeaveApproval::with(['leave.user.company', 'leave.approvals.approver', 'approver'])
            ->where('status', 'pending')->where('approver_id', $userId)
            ->whereHas('leave', fn ($query) => $query->where('status', 'pending'))->latest()->get();
    }

    public function pendingForRecipient(int $leaveId, int $recipientId): ?UserLeaveApproval
    {
        return UserLeaveApproval::query()->where('user_leave_id', $leaveId)
            ->where('approver_id', $recipientId)->where('status', 'pending')->lockForUpdate()->first();
    }

    public function allApproved(UserLeave $leave): bool
    {
        return ! $leave->approvals()->where('status', '!=', 'approved')->exists();
    }
}
