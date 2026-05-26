<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreShiftRequest;
use App\Http\Requests\Admin\UpdateShiftRequest;
use App\Http\Resources\Admin\ShiftFormResource;
use App\Http\Resources\Admin\ShiftPageResource;
use App\Models\Shift;
use App\Repositories\Contracts\ShiftRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function __construct(
        private readonly ShiftRepositoryInterface $shifts,
    ) {}

    /**
     * Tampilkan daftar semua shift dengan filter.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search']);

        $paginator = $this->shifts->paginate($filters);

        return Inertia::render(
            'admin/shifts/index',
            ShiftPageResource::make([
                'shifts' => $paginator,
                'filters' => $filters,
            ])->resolve(),
        );
    }

    /**
     * Tampilkan form tambah shift baru.
     */
    public function create(): Response
    {
        return Inertia::render(
            'admin/shifts/create',
            ShiftFormResource::make([])->resolve(),
        );
    }

    /**
     * Simpan shift baru ke database.
     */
    public function store(StoreShiftRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        
        $this->shifts->create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Konfigurasi Shift berhasil ditambahkan.']);

        return to_route('admin.shifts.index');
    }

    /**
     * Tampilkan form edit shift.
     */
    public function edit(Shift $shift): Response
    {
        return Inertia::render(
            'admin/shifts/edit',
            ShiftFormResource::make(['shift' => $shift])->resolve(),
        );
    }

    /**
     * Update data shift.
     */
    public function update(UpdateShiftRequest $request, Shift $shift): RedirectResponse
    {
        $validated = $request->validated();

        $this->shifts->update($shift, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Konfigurasi Shift berhasil diperbarui.']);

        return to_route('admin.shifts.index');
    }

    /**
     * Hapus shift.
     */
    public function destroy(Shift $shift): RedirectResponse
    {
        // Validasi dependensi sebelum menghapus
        if ($shift->assignments()->count() > 0) {
            Inertia::flash('toast', [
                'type' => 'error', 
                'message' => 'Tidak dapat menghapus: Konfigurasi Shift ini sedang ditugaskan ke Pengguna/Karyawan.'
            ]);
            return back();
        }

        $this->shifts->delete($shift);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Konfigurasi Shift berhasil dihapus.']);

        return to_route('admin.shifts.index');
    }
}
