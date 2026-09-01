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
                ! empty($filters['group_id']),
                fn ($q) => $q->where('group_id', $filters['group_id'])
            )
            ->when(
                ! empty($filters['role']),
                fn ($q) => $q->role($filters['role'])
            )
            ->when(
                ! empty($filters['exclude_role']),
                function ($q) use ($filters) {
                    $exclude = (array) $filters['exclude_role'];
                    return $q->whereDoesntHave('roles', fn ($r) => $r->whereIn('name', $exclude));
                }
            )
            ->latest()
            ->paginate((int) ($filters['per_page'] ?? 10))
            ->withQueryString();
    }

    public function find(int $id): User
    {
        return User::query()->with('company')->findOrFail($id);
    }

    public function findByAzureId(string $azureId): ?User
    {
        return User::query()->where('azure_id', $azureId)->first();
    }

    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
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

    public function getUnverifiedUsers(?int $companyId = null): \Illuminate\Database\Eloquent\Collection
    {
        return User::query()
            ->with(['company', 'group'])
            ->where('is_verified', false)
            ->where('is_active', true)
            ->whereNotNull('employee_id')
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', RoleName::PoolAccount->value))
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function verifyUser(User $user, array $data): void
    {
        $user->update([
            'employee_id' => $data['employee_id'],
            'company_id' => $data['company_id'],
            'group_id' => $data['group_id'],
            'is_verified' => true,
        ]);
        
        $user->syncRoles([$data['role']]);
    }

    public function activeForDashboard(string $dateFrom, string $dateTo, ?int $companyId = null, ?string $workGroup = null): \Illuminate\Database\Eloquent\Collection
    {
        return User::query()
            ->where('is_active', true)
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->when($workGroup, function ($q) use ($workGroup) {
                $q->whereHas('group', function ($gq) use ($workGroup) {
                    $gq->where('name', $workGroup);
                });
            })
            ->whereDoesntHave('roles', fn ($q) => $q->whereIn('name', [RoleName::SuperAdmin->value, RoleName::PoolAccount->value]))
            ->with([
                'leaves' => fn ($q) => $q->approved()->where(function ($sub) use ($dateFrom, $dateTo) {
                    $sub->whereBetween('start_date', [$dateFrom, $dateTo])
                        ->orWhereBetween('end_date', [$dateFrom, $dateTo])
                        ->orWhere(function ($s) use ($dateFrom, $dateTo) {
                            $s->where('start_date', '<=', $dateFrom)
                              ->where('end_date', '>=', $dateTo);
                        });
                }),
                'shiftAssignments',
                'exceptions' => fn ($q) => $q->whereBetween('date', [$dateFrom, $dateTo]),
                'attendanceDays' => fn ($q) => $q->whereBetween('work_date', [$dateFrom, $dateTo]),
            ])
            ->get();
    }

    public function getEmployeesForRoster(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        return User::query()
            ->with(['company', 'group', 'shiftAssignments', 'exceptions', 'leaves' => fn($q) => $q->approved()])
            ->whereNotNull('employee_id')
            ->where('is_active', true)
            ->whereDoesntHave('roles', fn ($q) => $q->whereIn('name', [RoleName::SuperAdmin->value, RoleName::PoolAccount->value]))
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
