<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Http\Resources\Settings\SecurityPageResource;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class SecurityController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    /**
     * Show the user's security settings page.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $canManageTwoFactor = Features::canManageTwoFactorAuthentication();

        if ($canManageTwoFactor) {
            $request->ensureStateIsValid();
        }

        return Inertia::render(
            'settings/security',
            SecurityPageResource::make([
                'canManageTwoFactor' => $canManageTwoFactor,
                'passwordRules' => Password::defaults()->toPasswordRulesString(),
                'twoFactorEnabled' => $canManageTwoFactor
                    ? $request->user()->hasEnabledTwoFactorAuthentication()
                    : false,
                'requiresConfirmation' => $canManageTwoFactor
                    ? Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm')
                    : false,
            ])->resolve(),
        );
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $this->users->updatePassword($request->user(), $request->password);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }
}
