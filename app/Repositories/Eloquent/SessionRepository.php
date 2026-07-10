<?php

namespace App\Repositories\Eloquent;

use App\Models\Session;
use App\Repositories\Contracts\SessionRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class SessionRepository implements SessionRepositoryInterface
{
    /**
     * Get all active sessions that have an associated user.
     * Eager loads the user relationship to avoid N+1 queries.
     *
     * @return Collection
     */
    public function getActiveSessions(): Collection
    {
        return Session::with('user')
            ->whereNotNull('user_id')
            ->orderBy('last_activity', 'desc')
            ->get();
    }

    /**
     * Revoke (delete) a session by its ID.
     *
     * @param string $id
     * @return bool
     */
    public function revokeSession(string $id): bool
    {
        $session = Session::find($id);
        
        if ($session) {
            return $session->delete();
        }

        return false;
    }
}
