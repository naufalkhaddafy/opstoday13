<?php

namespace App\Providers;

use App\Contracts\Fingerprint\FingerprintClientInterface;
use App\Models\User;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Repositories\Contracts\AttendanceLogRepositoryInterface;
use App\Repositories\Contracts\AttendanceSyncRunRepositoryInterface;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\ShiftRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\UserShiftAssignmentRepositoryInterface;
use App\Repositories\Eloquent\AttendanceDayRepository;
use App\Repositories\Eloquent\AttendanceLogRepository;
use App\Repositories\Eloquent\AttendanceSyncRunRepository;
use App\Repositories\Eloquent\CompanyRepository;
use App\Repositories\Eloquent\ShiftRepository;
use App\Repositories\Eloquent\UserRepository;
use App\Repositories\Eloquent\UserShiftAssignmentRepository;
use App\Services\Fingerprint\HttpFingerprintClient;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(CompanyRepositoryInterface::class, CompanyRepository::class);
        $this->app->bind(ShiftRepositoryInterface::class, ShiftRepository::class);
        $this->app->bind(UserShiftAssignmentRepositoryInterface::class, UserShiftAssignmentRepository::class);
        $this->app->bind(AttendanceLogRepositoryInterface::class, AttendanceLogRepository::class);
        $this->app->bind(AttendanceDayRepositoryInterface::class, AttendanceDayRepository::class);
        $this->app->bind(AttendanceSyncRunRepositoryInterface::class, AttendanceSyncRunRepository::class);
        $this->app->bind(FingerprintClientInterface::class, HttpFingerprintClient::class);
        $this->app->bind(\App\Repositories\Contracts\GroupRepositoryInterface::class, \App\Repositories\Eloquent\GroupRepository::class);
        $this->app->bind(\App\Repositories\Contracts\UserLeaveRepositoryInterface::class, \App\Repositories\Eloquent\UserLeaveRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureLastActiveTracking();
    }

    protected function configureLastActiveTracking(): void
    {
        Event::listen(Login::class, function (Login $event): void {
            if ($event->user instanceof User) {
                $event->user->markLastActive();
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
