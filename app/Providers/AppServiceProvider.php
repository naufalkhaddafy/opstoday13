<?php

namespace App\Providers;

use App\Repositories\Contracts\FingerprintClientInterface;
use App\Repositories\Contracts\SihepiTicketClientInterface;
use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use App\Repositories\Contracts\TicketRepositoryInterface;
use App\Repositories\Contracts\TicketSyncRunRepositoryInterface;
use App\Repositories\Contracts\TicketQueryRepositoryInterface;
use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use App\Models\User;
use App\Models\Company;
use App\Models\Group;
use App\Models\Shift;
use App\Models\Ticket;
use App\Observers\CompanyObserver;
use App\Observers\GroupObserver;
use App\Observers\ShiftObserver;
use App\Observers\TicketObserver;
use App\Models\Holiday;
use App\Observers\HolidayObserver;
use App\Repositories\Contracts\AttendanceDayRepositoryInterface;
use App\Repositories\Contracts\AttendanceLogRepositoryInterface;
use App\Repositories\Contracts\AttendanceSyncRunRepositoryInterface;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\ShiftRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\UserShiftAssignmentRepositoryInterface;
use App\Repositories\Contracts\GroupRepositoryInterface;
use App\Repositories\Contracts\UserLeaveRepositoryInterface;
use App\Repositories\Eloquent\AttendanceDayRepository;
use App\Repositories\Eloquent\AttendanceLogRepository;
use App\Repositories\Eloquent\AttendanceSyncRunRepository;
use App\Repositories\Eloquent\CompanyRepository;
use App\Repositories\Eloquent\ShiftRepository;
use App\Repositories\Eloquent\UserRepository;
use App\Repositories\Eloquent\UserShiftAssignmentRepository;
use App\Repositories\Eloquent\GroupRepository;
use App\Repositories\Eloquent\UserLeaveRepository;
use App\Repositories\Eloquent\TicketDashboardRepository;
use App\Repositories\Eloquent\TicketRepository;
use App\Repositories\Eloquent\TicketSyncRunRepository;
use App\Repositories\Eloquent\TicketQueryRepository;
use App\Repositories\Eloquent\ActivityLogRepository;
use App\Repositories\Contracts\HolidayRepositoryInterface;
use App\Repositories\Eloquent\HolidayRepository;
use App\Repositories\Contracts\SettingRepositoryInterface;
use App\Repositories\Eloquent\SettingRepository;
use App\Repositories\Contracts\SessionRepositoryInterface;
use App\Repositories\Eloquent\SessionRepository;
use App\Models\Setting;
use App\Observers\SettingObserver;
use App\Services\Fingerprint\HttpFingerprintClient;
use App\Services\Sihepi\HttpSihepiTicketClient;
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
        $this->app->bind(GroupRepositoryInterface::class, GroupRepository::class);
        $this->app->bind(UserLeaveRepositoryInterface::class, UserLeaveRepository::class);
        $this->app->bind(SihepiTicketClientInterface::class, HttpSihepiTicketClient::class);
        $this->app->bind(TicketRepositoryInterface::class, TicketRepository::class);
        $this->app->bind(TicketDashboardRepositoryInterface::class, TicketDashboardRepository::class);
        $this->app->bind(TicketQueryRepositoryInterface::class, TicketQueryRepository::class);
        $this->app->bind(TicketSyncRunRepositoryInterface::class, TicketSyncRunRepository::class);
        $this->app->bind(ActivityLogRepositoryInterface::class, ActivityLogRepository::class);
        $this->app->bind(HolidayRepositoryInterface::class, HolidayRepository::class);
        $this->app->bind(SettingRepositoryInterface::class, SettingRepository::class);
        $this->app->bind(SessionRepositoryInterface::class, SessionRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureLastActiveTracking();
        // Biarkan Laravel mendeteksi HTTPS dari proxy secara otomatis
        // agar tidak merusak akses langsung via IP.

        Company::observe(CompanyObserver::class);
        Group::observe(GroupObserver::class);
        Shift::observe(ShiftObserver::class);
        Ticket::observe(TicketObserver::class);
        Holiday::observe(HolidayObserver::class);
        Setting::observe(SettingObserver::class);

        Event::listen(
            \SocialiteProviders\Manager\SocialiteWasCalled::class,
            [\SocialiteProviders\Azure\AzureExtendSocialite::class, 'handle']
        );
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
