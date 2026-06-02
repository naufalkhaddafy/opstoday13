<?php

namespace App\Http\Controllers;

use App\Enums\RoleName;
use App\Http\Requests\StoreUserLeaveRequest;
use App\Http\Requests\UpdateUserLeaveRequest;
use App\Http\Resources\UserLeaveFormResource;
use App\Http\Resources\UserLeavePageResource;
use App\Models\UserLeave;
use App\Repositories\Contracts\UserLeaveRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveController extends Controller
{
    public function __construct(
        protected UserLeaveRepositoryInterface $leaves
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'type', 'search', 'month', 'year']);
        
        if ($request->user()->hasRole(RoleName::Engineer->value)) {
            $filters['user_id'] = $request->user()->id;
        } else {
            $filters['user_id'] = $request->input('user_id');
        }

        $paginator = $this->leaves->paginate($filters);

        return Inertia::render('leaves/index', 
            UserLeavePageResource::make([
                'leaves' => $paginator,
                'filters' => $filters,
            ])->resolve()
        );
    }

    public function create(Request $request): Response
    {
        return Inertia::render('leaves/create', 
            UserLeaveFormResource::make([])->resolve()
        );
    }

    public function store(StoreUserLeaveRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        
        // If engineer, force user_id to their own and status to approved as per new requirement
        if ($request->user()->hasRole(RoleName::Engineer->value)) {
            $validated['user_id'] = $request->user()->id;
            $validated['status'] = 'approved'; 
        } else {
            // Admins can create approved leaves directly
            $validated['status'] = $validated['status'] ?? 'approved';
        }

        $this->leaves->create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan cuti berhasil dibuat.']);

        return to_route('leaves.index');
    }

    public function edit(Request $request, UserLeave $leave): Response
    {
        // Engineers can only edit their own leaves
        if ($request->user()->hasRole(RoleName::Engineer->value) && $leave->user_id !== $request->user()->id) {
            abort(403);
        }

        return Inertia::render('leaves/edit', 
            UserLeaveFormResource::make(['leave' => $leave])->resolve()
        );
    }

    public function update(UpdateUserLeaveRequest $request, UserLeave $leave): RedirectResponse
    {
        if ($request->user()->hasRole(RoleName::Engineer->value) && $leave->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validated();

        if ($request->user()->hasRole(RoleName::Engineer->value)) {
            // Engineers cannot change the status
            unset($validated['status']);
        }

        $this->leaves->update($leave, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan cuti berhasil diperbarui.']);

        return to_route('leaves.index');
    }

    public function destroy(Request $request, UserLeave $leave): RedirectResponse
    {
        if ($request->user()->hasRole(RoleName::Engineer->value) && $leave->user_id !== $request->user()->id) {
            abort(403);
        }

        $this->leaves->delete($leave);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan cuti berhasil dihapus.']);

        return to_route('leaves.index');
    }
}
