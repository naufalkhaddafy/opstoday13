<?php

namespace App\Repositories\Contracts;

use App\Models\Company;
use Illuminate\Pagination\LengthAwarePaginator;

interface CompanyRepositoryInterface
{
    public function paginate(array $filters = []): LengthAwarePaginator;

    public function find(int $id): Company;

    public function create(array $data): Company;

    public function update(Company $company, array $data): Company;

    public function delete(Company $company): void;

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Company>
     */
    public function all(): \Illuminate\Database\Eloquent\Collection;
}
