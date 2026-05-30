<?php

namespace App\Repositories\Eloquent;

use App\Enums\RoleName;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return User::query()
            ->with(['company', 'group', 'activeShiftAssignment'])
            ->when(
                ! empty($filters['search']),
                fn ($q) => $q->where(function ($inner) use ($filters) {
                    $inner
                        ->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('email', 'like', "%{$filters['search']}%")
                        ->orWhere('employee_id', 'like', "%{$filters['search']}%");
                })
            )
            ->when(
                ! empty($filters['company_id']),
                fn ($q) => $q->where('company_id', $filters['company_id'])
            )
            ->when(
                ! empty($filters['role']),
                fn ($q) => $q->role($filters['role'])
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();
    }

    public function find(int $id): User
    {
        return User::query()->with('company')->findOrFail($id);
    }

    public function create(array $data): User
    {
        return User::query()->create($data);
    }


    public function assignRole(User $user, RoleName $role): void
    {
        $user->syncRoles([$role->value]);
    }

    public function updateProfile(User $user, array $data): User
    {
        $user->fill($data);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return $user;
    }

    public function updatePassword(User $user, string $password): void
    {
        $user->update([
            'password' => $password,
        ]);
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function getEmployeesForRoster(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        return User::query()
            ->with(['company', 'group', 'shiftAssignments', 'exceptions'])
            ->whereNotNull('employee_id')
            ->where('is_active', true)
            ->when(! empty($filters['search']), function ($q) use ($filters) {
                $q->where(function ($inner) use ($filters) {
                    $inner->where('name', 'like', "%{$filters['search']}%")
                          ->orWhere('email', 'like', "%{$filters['search']}%")
                          ->orWhere('employee_id', 'like', "%{$filters['search']}%");
                });
            })
            ->when(! empty($filters['company_id']) && $filters['company_id'] !== 'all', function ($q) use ($filters) {
                $q->where('company_id', $filters['company_id']);
            })
            ->when(! empty($filters['group_id']) && $filters['group_id'] !== 'all', function ($q) use ($filters) {
                $q->where('group_id', $filters['group_id']);
            })
            ->orderBy('name')
            ->get();
    }
}
