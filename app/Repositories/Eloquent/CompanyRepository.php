<?php

namespace App\Repositories\Eloquent;

use App\Models\Company;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class CompanyRepository implements CompanyRepositoryInterface
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return Company::query()
            ->withCount(['users'])
            ->when(
                ! empty($filters['search']),
                fn ($q) => $q->where(function ($inner) use ($filters) {
                    $inner
                        ->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('slug', 'like', "%{$filters['search']}%");
                })
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();
    }

    public function find(int $id): Company
    {
        return Company::query()
            ->withCount(['users'])
            ->findOrFail($id);
    }

    public function create(array $data): Company
    {
        return Company::query()->create($data);
    }

    public function update(Company $company, array $data): Company
    {
        $company->update($data);

        return $company;
    }

    public function delete(Company $company): void
    {
        $company->delete();
    }

    public function all(): \Illuminate\Database\Eloquent\Collection
    {
        $rows = Cache::get('companies.all');

        if (! is_array($rows)) {
            $rows = Company::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn (Company $company) => $company->only(['id', 'name']))
                ->values()
                ->all();

            Cache::forever('companies.all', $rows);
        }

        return Company::query()->hydrate($rows);
    }
}
