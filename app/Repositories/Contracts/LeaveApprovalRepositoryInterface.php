<?php

namespace App\Repositories\Contracts;

use App\Models\UserLeave;
use App\Models\UserLeaveApproval;
use Illuminate\Database\Eloquent\Collection;

interface LeaveApprovalRepositoryInterface
{
    public function lockLeave(int $id): UserLeave;

    public function lockApproval(int $id): UserLeaveApproval;

    public function closeRemaining(UserLeave $leave): void;

    public function nextWaiting(UserLeave $leave): ?UserLeaveApproval;

    public function pendingForUser(int $userId): Collection;

    public function pendingForRecipient(int $leaveId, int $recipientId): ?UserLeaveApproval;

    public function allApproved(UserLeave $leave): bool;
}
