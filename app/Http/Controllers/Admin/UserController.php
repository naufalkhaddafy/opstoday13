<?php

namespace App\Http\Controllers\Admin;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\UserFormResource;
use App\Http\Resources\Admin\UserPageResource;
use App\Http\Resources\Admin\UserAttendancePageResource;
use App\Http\Resources\Admin\UserTicketsPageResource;
use App\Models\Ticket;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\UserShiftAssignmentRepositoryInterface;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UserAttendanceExport;

class UserController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly UserShiftAssignmentRepositoryInterface $assignments,
        private readonly AttendanceDayRepositoryInterface $attendanceDays,
    ) {}

    /**
     * Tampilkan daftar semua user dengan filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'role', 'company_id', 'group_id']);

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

        // Create shift assignment if shift_schedule was provided
        $hasSchedule = ! empty($shiftData['shift_schedule']) && collect($shiftData['shift_schedule'])->filter()->isNotEmpty();
        if ($hasSchedule) {
            $this->assignments->create([
                'user_id' => $user->id,
                'schedule' => $shiftData['shift_schedule'],
                'effective_from' => $shiftData['effective_from'] ?? now()->toDateString(),
                'effective_to' => $shiftData['effective_to'] ?? null,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User berhasil ditambahkan.']);

        return to_route('admin.users.index');
    }

    /**
     * Tampilkan form edit user.
     */
    public function edit(Request $request, User $user): Response
    {
        // Muat relasi company & group sebelum dikirim ke Resource
        $user->load(['company', 'group']);

        return Inertia::render(
            'admin/users/edit',
            array_merge(
                UserFormResource::make(['user' => $user])->resolve(),
                ['from' => $request->input('from')],
            ),
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

        $from = $validated['from'] ?? null;
        unset($validated['from']);

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

        if ($from === 'roster') {
            return to_route('admin.roster.index');
        }

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
     * @return array{shift_schedule: array|null, effective_from: string|null, effective_to: string|null}
     */
    private function extractShiftData(array &$validated): array
    {
        $shiftSchedule = $validated['shift_schedule'] ?? null;
        if (is_array($shiftSchedule)) {
            // Ensure keys are strictly 1 to 7 and not 0-indexed garbage
            $cleanSchedule = [];
            for ($i = 1; $i <= 7; $i++) {
                $val = null;
                if (array_key_exists($i, $shiftSchedule)) {
                    $val = $shiftSchedule[$i];
                } elseif (array_key_exists((string)$i, $shiftSchedule)) {
                    $val = $shiftSchedule[(string)$i];
                }
                
                // Keep it strictly integer or null
                $cleanSchedule[$i] = $val !== null ? (int)$val : null;
            }
            $shiftSchedule = $cleanSchedule;
        }

        $shiftData = [
            'shift_schedule' => $shiftSchedule,
            'effective_from' => $validated['shift_effective_from'] ?? null,
            'effective_to' => $validated['shift_effective_to'] ?? null,
        ];

        unset(
            $validated['shift_schedule'],
            $validated['shift_effective_from'],
            $validated['shift_effective_to'],
        );

        return $shiftData;
    }

    /**
     * Normalize a schedule array to consistent format: int keys 1-7, int|null values.
     *
     * @return array<int, int|null>
     */
    private function normalizeSchedule(?array $schedule): array
    {
        $normalized = [];
        for ($i = 1; $i <= 7; $i++) {
            $val = $schedule[$i] ?? $schedule[(string) $i] ?? null;
            $normalized[$i] = $val !== null ? (int) $val : null;
        }

        return $normalized;
    }

    /**
     * Sync the active shift assignment for a user.
     * If the shift schedule changed, close the old assignment and create a new one.
     * If shift_schedule is empty or has no active shifts, close any active assignment.
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

        $newSchedule = $shiftData['shift_schedule'] ?? null;
        $hasNewSchedule = ! empty($newSchedule) && collect($newSchedule)->filter()->isNotEmpty();

        // No shift schedule selected — close any active assignment
        if (! $hasNewSchedule) {
            if ($activeAssignment) {
                $this->assignments->update($activeAssignment, [
                    'effective_to' => now()->subDay()->toDateString(),
                ]);
            }
            return;
        }

        // Normalize the new schedule to consistent format
        $newNormalized = $this->normalizeSchedule($newSchedule);

        // Compare schedules using normalized format (fixes string/int key mismatch)
        $areSchedulesIdentical = false;
        if ($activeAssignment && $activeAssignment->schedule) {
            $oldNormalized = $this->normalizeSchedule($activeAssignment->schedule);
            $areSchedulesIdentical = ($oldNormalized === $newNormalized);
        }

        // Same schedule — update the existing assignment details
        if ($activeAssignment && $areSchedulesIdentical) {
            $updateData = [];
            if ($shiftData['effective_from'] !== null) {
                $updateData['effective_from'] = $shiftData['effective_from'];
            }
            $updateData['effective_to'] = $shiftData['effective_to'];
            $this->assignments->update($activeAssignment, $updateData);
            return;
        }

        // Different schedule — close old and create new
        if ($activeAssignment) {
            $newEffectiveFrom = $shiftData['effective_from'] ?: now()->toDateString();
            $newEffectiveFromCarbon = \Carbon\Carbon::parse($newEffectiveFrom);

            if ($newEffectiveFromCarbon->greaterThan($activeAssignment->effective_from)) {
                $this->assignments->update($activeAssignment, [
                    'effective_to' => $newEffectiveFromCarbon->copy()->subDay()->toDateString(),
                ]);
            } else {
                $activeAssignment->delete();
            }
        }

        // Store with normalized schedule to prevent future mismatches
        $this->assignments->create([
            'user_id' => $user->id,
            'schedule' => $newNormalized,
            'effective_from' => $shiftData['effective_from'] ?: now()->toDateString(),
            'effective_to' => $shiftData['effective_to'] ?: null,
        ]);
    }

    /**
     * Tampilkan detail rekap absensi harian & KPI bulanan user terpilih.
     */
    public function attendance(
        Request $request,
        User $user,
        ShiftAssignmentResolver $shiftResolver
    ): Response {
        $timezone = config('app.timezone');
        
        $year = (int) $request->input('year', now($timezone)->year);
        $month = (int) $request->input('month', now($timezone)->month);
        
        $startOfMonth = CarbonImmutable::create($year, $month, 1, 0, 0, 0, $timezone);
        $endOfMonth = $startOfMonth->endOfMonth();
        
        $days = $this->attendanceDays->getForUserInDateRange($user, $startOfMonth, $endOfMonth)
            ->keyBy(fn ($record) => $record->work_date->toDateString());
            
        return Inertia::render(
            'admin/users/attendance',
            UserAttendancePageResource::make([
                'user' => $user,
                'attendance_days' => $days,
                'month' => $month,
                'year' => $year,
                'shift_resolver' => $shiftResolver,
            ])->resolve()
        );
    }

    /**
     * Export detail rekap absensi harian user ke Excel.
     */
    public function attendanceExport(
        Request $request,
        User $user,
        ShiftAssignmentResolver $shiftResolver
    ) {
        $timezone = config('app.timezone');
        
        $year = (int) $request->input('year', now($timezone)->year);
        $month = (int) $request->input('month', now($timezone)->month);
        
        $startOfMonth = CarbonImmutable::create($year, $month, 1, 0, 0, 0, $timezone);
        $endOfMonth = $startOfMonth->endOfMonth();
        
        $days = $this->attendanceDays->getForUserInDateRange($user, $startOfMonth, $endOfMonth)
            ->keyBy(fn ($record) => $record->work_date->toDateString());
            
        $resource = UserAttendancePageResource::make([
            'user' => $user,
            'attendance_days' => $days,
            'month' => $month,
            'year' => $year,
            'shift_resolver' => $shiftResolver,
        ])->resolve($request);

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $monthName = $monthNames[$month] ?? '';

        $fileName = "Attendance_{$user->name}_{$monthName}_{$year}.xlsx";

        return Excel::download(new UserAttendanceExport($resource['attendance_logs'], $user->name, $monthName, $year), $fileName);
    }

    /**
     * Tampilkan report tiket IT yang ditangani user terpilih.
     */
    public function tickets(Request $request, User $user): Response
    {
        $timezone = config('app.timezone');

        $status = $request->input('status');
        $search = trim((string) $request->input('search', ''));
        $year = (int) $request->input('year', now($timezone)->year);

        $monthInput = $request->input('month', now($timezone)->month);
        $showAllMonths = $monthInput === 'all';
        $month = $showAllMonths ? null : (int) $monthInput;

        $dateExpression = 'COALESCE(api_creation_date, first_seen_at, status_changed_at)';

        $tickets = Ticket::query()
            ->where('assigned_to_user_id', $user->id)
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('ticket_no', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                });
            })
            ->when(! $showAllMonths, function ($query) use ($dateExpression, $month, $year) {
                $query->whereRaw("MONTH({$dateExpression}) = ?", [$month])
                    ->whereRaw("YEAR({$dateExpression}) = ?", [$year]);
            })
            ->orderByRaw("CASE WHEN status = 'closed' THEN 1 ELSE 0 END")
            ->orderByRaw('COALESCE(completed_date, status_changed_at) DESC')
            ->orderByDesc('status_changed_at')
            ->get();

        return Inertia::render(
            'admin/users/tickets',
            UserTicketsPageResource::make([
                'user' => $user,
                'tickets' => $tickets,
                'status' => $status,
                'search' => $search !== '' ? $search : null,
                'month' => $showAllMonths ? 'all' : $month,
                'year' => $year,
            ])->resolve()
        );
    }
}
