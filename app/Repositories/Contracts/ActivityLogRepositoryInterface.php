<?php

namespace App\Repositories\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface ActivityLogRepositoryInterface
{
    /**
     * Get paginated activity logs.
     *
     * @param int $perPage
     * @param string|null $search
     * @return LengthAwarePaginator
     */
    public function getPaginatedLogs(int $perPage = 15, ?string $search = null): LengthAwarePaginator;
}
