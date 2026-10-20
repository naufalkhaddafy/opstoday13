<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserLeave;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserLeavePolicy
{
    use HandlesAuthorization;

    public function approveOrReject(User $user, UserLeave $leave): bool
    {
        // Admins can do anything
        if ($user->hasRole('admin')) {
            return true;
        }
        
        // Cek apakah user ada di tabel approvals untuk cuti ini
        return $leave->approvals()->where('approver_id', $user->id)->exists();
    }
}
