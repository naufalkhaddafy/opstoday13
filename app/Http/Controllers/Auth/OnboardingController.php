<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\OnboardingRequest;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\GroupRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        private readonly CompanyRepositoryInterface $companyRepository,
        private readonly GroupRepositoryInterface $groupRepository,
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function index(Request $request): Response|RedirectResponse
    {
        // If user already filled employee_id but just waiting for SPV, redirect to waiting
        if (!empty($request->user()->employee_id)) {
            return redirect()->route('onboarding.waiting');
        }

        return Inertia::render('auth/onboarding', [
            'companies' => $this->companyRepository->all(),
            'groups' => $this->groupRepository->all(),
        ]);
    }

    public function store(OnboardingRequest $request)
    {
        $user = $request->user();
        
        $this->userRepository->updateProfile($user, $request->validated());

        return redirect()->route('onboarding.waiting');
    }

    public function waiting(Request $request): Response|RedirectResponse
    {
        // If somehow they don't have employee_id yet, go back to index
        if (empty($request->user()->employee_id)) {
            return redirect()->route('onboarding.index');
        }

        // If they are already verified, go to dashboard
        if ($request->user()->is_verified) {
            return redirect()->intended(route('home'));
        }

        return Inertia::render('auth/waiting-verification');
    }
}
