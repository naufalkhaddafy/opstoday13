<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class UpdateUserLastActive
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();

        if ($user === null) {
            return $response;
        }

        $cacheKey = 'user-last-active:'.$user->getKey();

        if (! Cache::has($cacheKey)) {
            $user->markLastActive();
            Cache::put($cacheKey, true, now()->addMinutes(5));
        }

        return $response;
    }
}
