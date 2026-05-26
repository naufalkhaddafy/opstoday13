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
use App\Repositories\Contracts\UserShiftAssignmentRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly UserShiftAssignmentRepositoryInterface $assignments,
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

        // Extract shift data before processing user
        $shiftData = $this->extractShiftData($validated);

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

        // Create shift assignment if shift_id was provided
        if (! empty($shiftData['shift_id'])) {
            $this->assignments->create([
                'user_id' => $user->id,
                'shift_id' => $shiftData['shift_id'],
                'effective_from' => $shiftData['effective_from'] ?? now()->toDateString(),
                'effective_to' => $shiftData['effective_to'] ?? null,
                'days_of_week' => $shiftData['days_of_week'] ?? [1, 2, 3, 4, 5],
            ]);
        }

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

        // Extract shift data before processing user
        $shiftData = $this->extractShiftData($validated);

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

        // Sync shift assignment
        $this->syncShiftAssignment($user, $shiftData);

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

    /**
     * Extract shift-related fields from validated data and remove them.
     *
     * @return array{shift_id: int|null, effective_from: string|null, effective_to: string|null, days_of_week: int[]|null}
     */
    private function extractShiftData(array &$validated): array
    {
        $shiftData = [
            'shift_id' => $validated['shift_id'] ?? null,
            'effective_from' => $validated['shift_effective_from'] ?? null,
            'effective_to' => $validated['shift_effective_to'] ?? null,
            'days_of_week' => $validated['shift_days_of_week'] ?? null,
        ];

        unset(
            $validated['shift_id'],
            $validated['shift_effective_from'],
            $validated['shift_effective_to'],
            $validated['shift_days_of_week'],
        );

        return $shiftData;
    }

    /**
     * Sync the active shift assignment for a user.
     * If the shift changed, close the old assignment and create a new one.
     * If shift_id is null/empty, close any active assignment.
     */
    private function syncShiftAssignment(User $user, array $shiftData): void
    {
        $activeAssignment = $user->shiftAssignments()
            ->where(function ($query) {
                $query->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', now()->toDateString());
            })
            ->orderByDesc('effective_from')
            ->first();

        $newShiftId = $shiftData['shift_id'] ?? null;

        // No shift selected — close any active assignment
        if (empty($newShiftId)) {
            if ($activeAssignment) {
                $this->assignments->update($activeAssignment, [
                    'effective_to' => now()->subDay()->toDateString(),
                ]);
            }
            return;
        }

        // Same shift — update the existing assignment details
        if ($activeAssignment && $activeAssignment->shift_id == $newShiftId) {
            $updateData = [];
            if ($shiftData['effective_from'] !== null) {
                $updateData['effective_from'] = $shiftData['effective_from'];
            }
            $updateData['effective_to'] = $shiftData['effective_to'];
            if ($shiftData['days_of_week'] !== null) {
                $updateData['days_of_week'] = $shiftData['days_of_week'];
            }
            $this->assignments->update($activeAssignment, $updateData);
            return;
        }

        // Different shift — close old and create new
        if ($activeAssignment) {
            $this->assignments->update($activeAssignment, [
                'effective_to' => now()->subDay()->toDateString(),
            ]);
        }

        $this->assignments->create([
            'user_id' => $user->id,
            'shift_id' => $newShiftId,
            'effective_from' => $shiftData['effective_from'] ?? now()->toDateString(),
            'effective_to' => $shiftData['effective_to'] ?? null,
            'days_of_week' => $shiftData['days_of_week'] ?? [1, 2, 3, 4, 5],
        ]);
    }
}
