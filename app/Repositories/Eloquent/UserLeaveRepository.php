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
