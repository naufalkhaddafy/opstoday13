<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionResource;
use App\Repositories\Contracts\SessionRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActiveSessionController extends Controller
{
    public function __construct(
        private readonly SessionRepositoryInterface $sessionRepository
    ) {}

    /**
     * Display a listing of active sessions.
     */
    public function index()
    {
        $sessions = $this->sessionRepository->getActiveSessions();

        return Inertia::render('admin/sessions/Index', [
            'sessions' => SessionResource::collection($sessions)->resolve(),
        ]);
    }

    /**
     * Revoke (delete) a specific session, forcing the user to logout on that device.
     */
    public function destroy(string $id, Request $request)
    {
        // Prevent users from deleting their own current session via this button
        if ($id === $request->session()->getId()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Anda tidak bisa mencabut sesi Anda sendiri saat ini. Gunakan fitur Logout.']);
            return back();
        }

        $deleted = $this->sessionRepository->revokeSession($id);

        if ($deleted) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Sesi pengguna berhasil dicabut. Pengguna tersebut telah di-logout.']);
        } else {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Sesi tidak ditemukan. Mungkin sudah berakhir (expired).']);
        }

        return back();
    }
}
