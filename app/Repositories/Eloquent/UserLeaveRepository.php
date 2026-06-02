<?php

namespace App\Repositories\Eloquent;

use App\Models\UserLeave;
use App\Repositories\Contracts\UserLeaveRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

class UserLeaveRepository implements UserLeaveRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = UserLeave::query()->with('user');

        if ($userId = Arr::get($filters, 'user_id')) {
            $query->where('user_id', $userId);
        }

        if ($type = Arr::get($filters, 'type')) {
            $query->where('type', $type);
        }

        if ($status = Arr::get($filters, 'status')) {
            $query->where('status', $status);
        }

        if ($search = Arr::get($filters, 'search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($month = Arr::get($filters, 'month')) {
            $query->whereMonth('start_date', $month);
        }

        if ($year = Arr::get($filters, 'year')) {
            $query->whereYear('start_date', $year);
        }

        return $query->orderByDesc('start_date')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $data): UserLeave
    {
        return UserLeave::create($data);
    }

    public function update(UserLeave $leave, array $data): bool
    {
        return $leave->update($data);
    }

    public function delete(UserLeave $leave): bool
    {
        return $leave->delete();
    }
}
