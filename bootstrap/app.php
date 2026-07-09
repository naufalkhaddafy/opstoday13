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

        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'verified' => \App\Http\Middleware\EnsureUserIsVerifiedAndOnboarded::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function (Schedule $schedule): void {
        $settings = app(\App\Repositories\Contracts\SettingRepositoryInterface::class);

        $syncOpenInterval = $settings->get('sync_open_tickets_interval', '1');
        $schedule->command('tickets:sync-open')
            ->cron('*/' . $syncOpenInterval . ' * * * *')
            ->withoutOverlapping(10)
            ->runInBackground()
            ->timezone(config('app.timezone'));

        $syncAttendanceInterval = $settings->get('sync_attendance_interval', '1');
        $schedule->command('attendance:sync')
            ->cron('*/' . $syncAttendanceInterval . ' * * * *')
            ->withoutOverlapping(10)
            ->runInBackground()
            ->timezone(config('app.timezone'));

        $syncCompletedCron = $settings->get('sync_completed_tickets_cron', '0 6,18 * * *');
        $schedule->command('tickets:sync-completed')
            ->cron($syncCompletedCron)
            ->withoutOverlapping()
            ->runInBackground()
            ->timezone(config('app.timezone'));

        $morningTime = $settings->get('wa_morning_schedule', '10:00');
        $schedule->command('ops:send-snapshot morning')
            ->dailyAt($morningTime)
            ->withoutOverlapping()
            ->runInBackground()
            ->timezone(config('app.timezone'));

        $eveningTime = $settings->get('wa_evening_schedule', '19:00');
        $schedule->command('ops:send-snapshot evening')
            ->dailyAt($eveningTime)
            ->withoutOverlapping()
            ->runInBackground()
            ->timezone(config('app.timezone'));
    })
    ->create();
