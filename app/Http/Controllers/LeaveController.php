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
        
        $isSelfRequest = false;

        // If engineer, force user_id to their own
        if ($request->user()->hasRole(RoleName::Engineer->value)) {
            $validated['user_id'] = $request->user()->id;
            $isSelfRequest = true;
        } else {
            // Admins/SPV
            if (!isset($validated['user_id']) || $validated['user_id'] == $request->user()->id) {
                $validated['user_id'] = $request->user()->id;
                $isSelfRequest = true;
            }
        }

        if ($isSelfRequest) {
            if ($validated['type'] === 'cuti') {
                $validated['status'] = 'pending';
            } else {
                $validated['status'] = 'approved';
            }
        } else {
            // Admins creating for someone else can bypass approval
            $validated['status'] = $validated['status'] ?? 'approved';
        }

        $leave = $this->leaves->create($validated);
        $leave->load('user.company');

        // Generate Approval Workflow if status is pending
        if ($leave->status === 'pending' && $leave->user && $leave->user->company) {
            $rule = $leave->user->company->resolveLeaveApprovalRule($leave->user->group_id);
            $approverIds = $rule['approver_ids'] ?? [];

            if (!empty($approverIds)) {
                $workflowType = $rule['workflow_type'] ?? 'parallel';
                $requirement = $rule['requirement'] ?? 'any';
                $isSequential = $workflowType === 'sequential' && $requirement !== 'any';

                foreach ($approverIds as $index => $approverId) {
                    // Sequential step 2+ starts as 'waiting' — not visible until previous step is approved
                    $isDownstreamSequential = $isSequential && $index > 0;

                    \App\Models\UserLeaveApproval::create([
                        'user_leave_id' => $leave->id,
                        'approver_id'   => $approverId,
                        'status'        => $isDownstreamSequential ? 'waiting' : 'pending',
                        'step_order'    => $isSequential ? ($index + 1) : 1,
                    ]);

                    // Notify: parallel → all, any-requirement → all, sequential → only step 1
                    if (!$isDownstreamSequential) {
                        $approverUser = \App\Models\User::find($approverId);
                        if ($approverUser) {
                            \App\Jobs\SendLeaveNotificationJob::dispatch($leave, 'new_request', $approverUser);
                        }
                    }
                }
            }
        } else if ($leave->status === 'approved' && $isSelfRequest && $leave->user && $leave->user->company && $leave->type !== 'cuti') {
            // Auto approved (sakit/izin): just send info notification to all approvers
            $rule = $leave->user->company->resolveLeaveApprovalRule($leave->user->group_id);
            $approverIds = $rule['approver_ids'] ?? [];

            if (!empty($approverIds)) {
                foreach ($approverIds as $approverId) {
                    $approverUser = \App\Models\User::find($approverId);
                    if ($approverUser) {
                        \App\Jobs\SendLeaveNotificationJob::dispatch($leave, 'auto_approved_info', $approverUser);
                    }
                }
            }
        }

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
        if ($request->user()->hasRole(RoleName::Engineer->value)) {
            if ($leave->user_id != $request->user()->id) {
                abort(403, 'Unauthorized action. ID mismatch.');
            }
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
        if ($request->user()->hasRole(RoleName::Engineer->value)) {
            if ($leave->user_id != $request->user()->id) {
                abort(403, 'Unauthorized action. ID mismatch.');
            }
        }

        $this->leaves->delete($leave);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan cuti berhasil dihapus.']);

        return to_route('leaves.index');
    }
}
