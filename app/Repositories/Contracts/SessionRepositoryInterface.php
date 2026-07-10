<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface SessionRepositoryInterface
{
    /**
     * Get all active sessions that have an associated user.
     *
     * @return Collection
     */
    public function getActiveSessions(): Collection;

    /**
     * Revoke (delete) a session by its ID.
     *
     * @param string $id
     * @return bool
     */
    public function revokeSession(string $id): bool;
}
