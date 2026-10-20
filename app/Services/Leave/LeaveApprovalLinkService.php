<?php

namespace App\Services\Leave;

use App\Models\User;
use App\Models\UserLeave;
use App\Repositories\Contracts\LeaveApprovalRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LeaveApprovalLinkService
{
    public function __construct(private LeaveApprovalRepositoryInterface $approvals) {}

    public function issue(UserLeave $leave, User $recipient): array
    {
        return DB::transaction(function () use ($leave, $recipient) {
            $lockedLeave = $this->approvals->lockLeave($leave->id);
            $task = $this->approvals->pendingForRecipient($leave->id, $recipient->id);

            if (! $task || $lockedLeave->status !== 'pending') {
                return [];
            }

            $token = Str::random(64);
            $task->update([
                'email_token_hash' => hash('sha256', $token),
                'email_token_expires_at' => now()->addHours(48),
                'email_token_used_at' => null,
            ]);

            return collect(['approve', 'reject'])->mapWithKeys(fn ($action) => [
                $action => route('leave-approval-actions.show', ['approval' => $task->id, 'action' => $action, 'token' => $token]),
            ])->all();
        });
    }
}
