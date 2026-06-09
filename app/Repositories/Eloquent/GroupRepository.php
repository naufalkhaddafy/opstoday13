<?php

namespace App\Repositories\Eloquent;

use App\Models\Group;
use App\Repositories\Contracts\GroupRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class GroupRepository implements GroupRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return Group::query()
            ->withCount('users')
            ->when($filters['search'] ?? null, function (Builder $query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function all(): Collection
    {
        try {
            $rows = Cache::store('redis')->get('groups.all');
            if (! is_array($rows)) {
                $rows = Group::orderBy('name')->get()->toArray();
                Cache::store('redis')->forever('groups.all', $rows);
            }
            return Group::query()->hydrate($rows);
        } catch (\Exception $e) {
            return Group::orderBy('name')->get();
        }
    }

    public function create(array $data): Group
    {
        return Group::create($data);
    }

    public function update(Group $group, array $data): Group
    {
        $group->update($data);
        return $group;
    }

    public function delete(Group $group): bool
    {
        return $group->delete();
    }
}
