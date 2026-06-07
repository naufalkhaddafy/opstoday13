<?php

namespace App\Repositories\Contracts;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function paginate(array $filters = []): LengthAwarePaginator;

    public function find(int $id): User;

    public function create(array $data): User;

    public function assignRole(User $user, RoleName $role): void;

    public function updateProfile(User $user, array $data): User;

    public function updatePassword(User $user, string $password): void;

    public function delete(User $user): void;

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, User>
     */
    public function getEmployeesForRoster(array $filters = []): \Illuminate\Database\Eloquent\Collection;

    /**
     * User aktif (non super-admin) beserta relasi yang dibutuhkan untuk
     * ringkasan kehadiran pada tanggal tertentu.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, User>
     */
    public function activeForDashboard(string $date, ?int $companyId = null): \Illuminate\Database\Eloquent\Collection;
}
