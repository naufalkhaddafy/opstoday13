<?php

namespace App\Http\Controllers\Admin;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\UserFormResource;
use App\Http\Resources\Admin\UserPageResource;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    /**
     * Tampilkan daftar semua user dengan filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'role', 'company_id']);

        $paginator = $this->users->paginate($filters);

        return Inertia::render(
            'admin/users/index',
            UserPageResource::make([
                'users' => $paginator,
                'filters' => $filters,
            ])->resolve(),
        );
    }

    /**
     * Tampilkan form tambah user baru.
     */
    public function create(): Response
    {
        return Inertia::render(
            'admin/users/create',
            UserFormResource::make([])->resolve(),
        );
    }

    /**
     * Simpan user baru ke database.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Hash password sebelum disimpan
        $validated['password'] = Hash::make($validated['password']);

        // Tandai email sebagai terverifikasi jika is_verified diset
        if (! empty($validated['is_verified'])) {
            $validated['email_verified_at'] = now();
        }

        $role = RoleName::from($validated['role']);
        unset($validated['role'], $validated['is_verified'], $validated['password_confirmation']);

        $user = $this->users->create($validated);
        $this->users->assignRole($user, $role);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User berhasil ditambahkan.']);

        return to_route('admin.users.index');
    }

    /**
     * Tampilkan form edit user.
     */
    public function edit(User $user): Response
    {
        // Muat relasi company sebelum dikirim ke Resource
        $user->load('company');

        return Inertia::render(
            'admin/users/edit',
            UserFormResource::make(['user' => $user])->resolve(),
        );
    }

    /**
     * Update data user.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $role = RoleName::from($validated['role']);
        $isVerified = (bool) ($validated['is_verified'] ?? $user->is_verified);

        // Update field profil
        $profileData = collect($validated)
            ->except(['role', 'is_verified'])
            ->toArray();

        // Kelola status verifikasi email
        if ($isVerified && ! $user->is_verified) {
            $profileData['email_verified_at'] = now();
            $profileData['is_verified'] = true;
        } elseif (! $isVerified) {
            $profileData['email_verified_at'] = null;
            $profileData['is_verified'] = false;
        }

        $this->users->updateProfile($user, $profileData);
        $this->users->assignRole($user, $role);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User berhasil diperbarui.']);

        return to_route('admin.users.index');
    }

    /**
     * Hapus user.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->users->delete($user);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User berhasil dihapus.']);

        return to_route('admin.users.index');
    }
}
