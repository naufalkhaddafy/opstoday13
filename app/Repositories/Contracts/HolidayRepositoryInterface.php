<?php

namespace App\Repositories\Contracts;

use App\Models\Holiday;
use Illuminate\Database\Eloquent\Collection;

interface HolidayRepositoryInterface
{
    /**
     * @return Collection<int, Holiday>
     */
    public function getAll(): Collection;

    public function findById(int $id): ?Holiday;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Holiday;

    /**
     * @param array<string, mixed> $data
     */
    public function update(Holiday $holiday, array $data): bool;

    public function delete(Holiday $holiday): bool;

    public function isHoliday(string $date): bool;

    public function getHolidayName(string $date): ?string;
}
