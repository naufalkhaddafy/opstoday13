<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\UpdateUserLastActive;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            UpdateUserLastActive::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('attendance:sync')
            ->everyMinute()
            ->withoutOverlapping(10)
            ->runInBackground()
            ->timezone(config('app.timezone'));

        $schedule->command('tickets:sync-open')
            ->everyMinute()
            ->withoutOverlapping(10)
            ->runInBackground()
            ->timezone(config('app.timezone'));

        $schedule->command('tickets:sync-completed')
            ->twiceDaily(6, 18)
            ->withoutOverlapping()
            ->runInBackground()
            ->timezone(config('app.timezone'));

        $schedule->command('ops:send-snapshot morning')
            ->dailyAt('10:00')
            ->withoutOverlapping()
            ->runInBackground()
            ->timezone(config('app.timezone'));

        $schedule->command('ops:send-snapshot evening')
            ->dailyAt('19:00')
            ->withoutOverlapping()
            ->runInBackground()
            ->timezone(config('app.timezone'));
    })
    ->create();
