<?php

namespace App\Repositories\Contracts;

use App\Models\UserLeave;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserLeaveRepositoryInterface
{
    /**
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<UserLeave>
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): UserLeave;

    /**
     * @param array<string, mixed> $data
     */
    public function update(UserLeave $leave, array $data): bool;

    public function delete(UserLeave $leave): bool;
}
