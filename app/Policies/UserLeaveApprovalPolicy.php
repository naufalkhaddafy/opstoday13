<?php

namespace App\Policies;

use App\Enums\RoleName;
use App\Models\User;
use App\Models\UserLeaveApproval;

class UserLeaveApprovalPolicy
{
    public function decide(User $user, UserLeaveApproval $approval): bool
    {
        return $this->emailAction($user, $approval) || $user->hasRole(RoleName::SuperAdmin->value);
    }

    public function emailAction(User $user, UserLeaveApproval $approval): bool
    {
        return (int) $user->id === (int) $approval->approver_id;
    }
}
