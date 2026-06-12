<?php

namespace App\Http\Controllers\Admin;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\VerifyUserRequest;
use App\Models\User;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\GroupRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly CompanyRepositoryInterface $companyRepository,
        private readonly GroupRepositoryInterface $groupRepository
    ) {
    }

    public function index(Request $request): Response
    {
        $companyId = null;

        // If user is a SPV, restrict to their own company
        if ($request->user()->hasRole(RoleName::Supv->value)) {
            $companyId = $request->user()->company_id;
        }

        $users = $this->userRepository->getUnverifiedUsers($companyId);
        
        $roles = collect(RoleName::cases())->map(fn ($role) => $role->value);

        if ($request->user()->hasRole(RoleName::Supv->value)) {
            $roles = $roles->filter(fn ($role) => $role !== RoleName::SuperAdmin->value);
        }

        $roles = $roles->values()->toArray();

        return Inertia::render('admin/verifications/index', [
            'users' => $users,
            'companies' => $this->companyRepository->all(),
            'groups' => $this->groupRepository->all(),
            'roles' => $roles,
            'attendance_url' => env('FINGERPRINT_API_URL', '#'),
            'sihepi_url' => rtrim(env('SIHEPI_API_URL', '#'), '/') . '/GetAllTicketCompleted',
        ]);
    }

    public function verify(VerifyUserRequest $request, User $user)
    {
        // Security check for SPV
        if ($request->user()->hasRole(RoleName::Supv->value)) {
            if ($user->company_id !== $request->user()->company_id) {
                abort(403, 'Unauthorized action.');
            }
            if ($request->validated('role') === RoleName::SuperAdmin->value) {
                abort(403, 'Cannot assign super_admin role.');
            }
        }

        $this->userRepository->verifyUser($user, $request->validated());

        return redirect()->back()->with('success', 'User ' . $user->name . ' has been verified.');
    }
}
