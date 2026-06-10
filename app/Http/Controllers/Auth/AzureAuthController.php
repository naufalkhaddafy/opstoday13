<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AzureAuthController extends Controller
{
    public function __construct(private readonly UserRepositoryInterface $userRepository)
    {
    }
    public function redirect()
    {
        return Socialite::driver('azure')->redirect();
    }

    public function callback()
    {
        try {
            $azureUser = Socialite::driver('azure')->user();
        } catch (Exception $e) {
            return redirect()->route('login')->with('error', 'Authentication failed: ' . $e->getMessage());
        }

        // Restrict to configured tenant if specified
        $tenantId = config('services.azure.tenant');
        $userTenant = $azureUser->user['tenantId'] ?? null;
        
        if ($tenantId && $tenantId !== 'common' && $userTenant && $tenantId !== $userTenant) {
            return redirect()->route('login')->with('error', 'Unauthorized tenant.');
        }

        $user = $this->userRepository->findByAzureId($azureUser->id);

        if ($user) {
            // Update name just in case it changed
            $this->userRepository->updateProfile($user, [
                'name' => $azureUser->name,
            ]);
        } else {
            // Try finding by email
            $user = $this->userRepository->findByEmail($azureUser->email);

            if ($user) {
                $this->userRepository->updateProfile($user, [
                    'azure_id' => $azureUser->id,
                    'name' => $azureUser->name,
                ]);
            } else {
                // Auto-provision new user with is_verified = false
                $user = $this->userRepository->create([
                    'name' => $azureUser->name,
                    'email' => $azureUser->email,
                    'azure_id' => $azureUser->id,
                    'password' => bcrypt(Str::random(24)),
                    'is_verified' => false,
                    'is_active' => true,
                ]);
            }
        }

        Auth::login($user);

        return redirect()->intended(route('dashboard'));
    }
}
