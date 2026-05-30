<?php

namespace App\Repositories\Contracts;

use App\Models\Group;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface GroupRepositoryInterface
{
    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * @return Collection<int, Group>
     */
    public function all(): Collection;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Group;

    /**
     * @param array<string, mixed> $data
     */
    public function update(Group $group, array $data): Group;

    public function delete(Group $group): bool;
}
