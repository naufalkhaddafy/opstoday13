<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCompanyRequest;
use App\Http\Requests\Admin\UpdateCompanyRequest;
use App\Http\Resources\Admin\CompanyFormResource;
use App\Http\Resources\Admin\CompanyPageResource;
use App\Models\Company;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function __construct(
        private readonly CompanyRepositoryInterface $companies,
    ) {}

    /**
     * Tampilkan daftar semua perusahaan dengan filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search']);

        $paginator = $this->companies->paginate($filters);

        return Inertia::render(
            'admin/companies/index',
            CompanyPageResource::make([
                'companies' => $paginator,
                'filters' => $filters,
            ])->resolve(),
        );
    }

    /**
     * Tampilkan form tambah perusahaan baru.
     */
    public function create(): Response
    {
        return Inertia::render(
            'admin/companies/create',
            CompanyFormResource::make([])->resolve(),
        );
    }

    /**
     * Simpan perusahaan baru ke database.
     */
    public function store(StoreCompanyRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        
        // Generate slug dari nama perusahaan
        $validated['slug'] = Str::slug($validated['name']);

        $this->companies->create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perusahaan berhasil ditambahkan.']);

        return to_route('admin.companies.index');
    }

    /**
     * Tampilkan form edit perusahaan.
     */
    public function edit(Company $company): Response
    {
        return Inertia::render(
            'admin/companies/edit',
            CompanyFormResource::make(['company' => $company])->resolve(),
        );
    }

    /**
     * Update data perusahaan.
     */
    public function update(UpdateCompanyRequest $request, Company $company): RedirectResponse
    {
        $validated = $request->validated();

        // Update slug jika nama berubah
        if ($company->name !== $validated['name']) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $this->companies->update($company, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perusahaan berhasil diperbarui.']);

        return to_route('admin.companies.index');
    }

    /**
     * Hapus perusahaan.
     */
    public function destroy(Company $company): RedirectResponse
    {
        // Validasi dependensi sebelum menghapus
        if ($company->users()->count() > 0) {
            Inertia::flash('toast', [
                'type' => 'error', 
                'message' => 'Tidak dapat menghapus: Perusahaan masih memiliki data Pengguna yang terikat.'
            ]);
            return back();
        }

        if ($company->shifts()->count() > 0) {
            Inertia::flash('toast', [
                'type' => 'error', 
                'message' => 'Tidak dapat menghapus: Perusahaan masih memiliki data Shift yang terikat.'
            ]);
            return back();
        }

        $this->companies->delete($company);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perusahaan berhasil dihapus.']);

        return to_route('admin.companies.index');
    }
}
