<?php

namespace App\Repositories\Contracts;

use App\Models\UserShiftAssignment;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserShiftAssignmentRepositoryInterface
{
    public function paginate(array $filters = []): LengthAwarePaginator;

    public function find(int $id): UserShiftAssignment;

    public function create(array $data): UserShiftAssignment;

    public function update(UserShiftAssignment $assignment, array $data): UserShiftAssignment;

    public function delete(UserShiftAssignment $assignment): void;
}
