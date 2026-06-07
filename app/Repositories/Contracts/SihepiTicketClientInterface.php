<?php

namespace App\Repositories\Contracts;

interface SihepiTicketClientInterface
{
    /**
     * Fetch open/active tickets assigned to a single technician.
     *
     * @return list<array<string, mixed>>
     */
    public function fetchOpenFor(string $employeeId): array;

    /**
     * Fetch the full list of completed tickets (no server-side filter available).
     *
     * @return list<array<string, mixed>>
     */
    public function fetchCompleted(): array;
}
