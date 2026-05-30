<?php

namespace App\Repositories\Eloquent;

use App\Models\UserShiftAssignment;
use App\Repositories\Contracts\UserShiftAssignmentRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class UserShiftAssignmentRepository implements UserShiftAssignmentRepositoryInterface
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return UserShiftAssignment::query()
            ->with(['user:id,name,employee_id'])
            ->when(
                ! empty($filters['user_id']),
                fn ($q) => $q->where('user_id', $filters['user_id'])
            )
            ->when(
                ! empty($filters['shift_id']),
                fn ($q) => $q->where('shift_id', $filters['shift_id'])
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();
    }

    public function find(int $id): UserShiftAssignment
    {
        return UserShiftAssignment::query()
            ->with(['user:id,name'])
            ->findOrFail($id);
    }

    public function create(array $data): UserShiftAssignment
    {
        // Ensure days_of_week is correctly cast, handled by model
        return UserShiftAssignment::query()->create($data);
    }

    public function update(UserShiftAssignment $assignment, array $data): UserShiftAssignment
    {
        $assignment->update($data);

        return $assignment;
    }

    public function delete(UserShiftAssignment $assignment): void
    {
        $assignment->delete();
    }
}
