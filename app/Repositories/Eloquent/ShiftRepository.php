<?php

namespace App\Repositories\Eloquent;

use App\Models\Shift;
use App\Repositories\Contracts\ShiftRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ShiftRepository implements ShiftRepositoryInterface
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return Shift::query()
            ->withCount('assignments')
            ->when(
                ! empty($filters['search']),
                fn ($q) => $q->where(function ($inner) use ($filters) {
                    $inner
                        ->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('code', 'like', "%{$filters['search']}%");
                })
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();
    }

    public function find(int $id): Shift
    {
        return Shift::query()
            ->withCount('assignments')
            ->findOrFail($id);
    }

    public function create(array $data): Shift
    {
        return Shift::query()->create($data);
    }

    public function update(Shift $shift, array $data): Shift
    {
        $shift->update($data);

        return $shift;
    }

    public function delete(Shift $shift): void
    {
        $shift->delete();
    }
}
