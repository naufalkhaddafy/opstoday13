<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGroupRequest;
use App\Http\Requests\Admin\UpdateGroupRequest;
use App\Http\Resources\Admin\GroupFormResource;
use App\Http\Resources\Admin\GroupPageResource;
use App\Models\Group;
use App\Repositories\Contracts\GroupRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function __construct(
        private readonly GroupRepositoryInterface $groups,
    ) {}

    /**
     * Tampilkan daftar semua grup dengan filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search']);

        $paginator = $this->groups->paginate($filters);

        return Inertia::render(
            'admin/groups/index',
            GroupPageResource::make([
                'groups' => $paginator,
                'filters' => $filters,
            ])->resolve(),
        );
    }

    /**
     * Tampilkan form tambah grup baru.
     */
    public function create(): Response
    {
        return Inertia::render(
            'admin/groups/create',
            GroupFormResource::make([])->resolve(),
        );
    }

    /**
     * Simpan grup baru ke database.
     */
    public function store(StoreGroupRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        
        // Generate slug dari nama grup
        $validated['slug'] = Str::slug($validated['name']);

        $this->groups->create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Grup berhasil ditambahkan.']);

        return to_route('admin.groups.index');
    }

    /**
     * Tampilkan form edit grup.
     */
    public function edit(Group $group): Response
    {
        return Inertia::render(
            'admin/groups/edit',
            GroupFormResource::make(['group' => $group])->resolve(),
        );
    }

    /**
     * Update data grup.
     */
    public function update(UpdateGroupRequest $request, Group $group): RedirectResponse
    {
        $validated = $request->validated();

        // Update slug jika nama berubah
        if ($group->name !== $validated['name']) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $this->groups->update($group, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Grup berhasil diperbarui.']);

        return to_route('admin.groups.index');
    }

    /**
     * Hapus grup.
     */
    public function destroy(Group $group): RedirectResponse
    {
        // Validasi dependensi sebelum menghapus
        if ($group->users()->count() > 0) {
            Inertia::flash('toast', [
                'type' => 'error', 
                'message' => 'Tidak dapat menghapus: Grup masih memiliki data Pengguna yang terikat.'
            ]);
            return back();
        }

        $this->groups->delete($group);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Grup berhasil dihapus.']);

        return to_route('admin.groups.index');
    }
}
