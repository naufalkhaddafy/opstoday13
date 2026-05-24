<?php

namespace App\Repositories\Contracts;

use App\Enums\RoleName;
use App\Models\User;

interface UserRepositoryInterface
{
    public function create(array $data): User;

    public function assignRole(User $user, RoleName $role): void;

    public function updateProfile(User $user, array $data): User;

    public function updatePassword(User $user, string $password): void;

    public function delete(User $user): void;
}
