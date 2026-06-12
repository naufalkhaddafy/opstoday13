<?php

namespace App\Repositories\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface TicketQueryRepositoryInterface
{
    /**
     * Get paginated overall tickets with filters.
     *
     * @param array<string, mixed> $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getOverallTickets(array $filters, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get overall tickets stats with filters.
     *
     * @param array<string, mixed> $filters
     * @return array<string, int>
     */
    public function getOverallTicketsStats(array $filters): array;
}
