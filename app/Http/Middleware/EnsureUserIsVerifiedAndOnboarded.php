<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsVerifiedAndOnboarded
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->is_verified) {
            // Check if user has filled their employee_id (onboarding completed but waiting)
            if (empty($user->employee_id)) {
                return redirect()->route('onboarding.index');
            }

            return redirect()->route('onboarding.waiting');
        }

        return $next($request);
    }
}
