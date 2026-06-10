   <?php

use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\RosterController;
use App\Http\Controllers\Admin\RosterExceptionController;
use App\Http\Controllers\Admin\RosterExportController;
use App\Http\Controllers\Admin\ScheduleLogController;
use App\Http\Controllers\Admin\ShiftController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\GroupController;
use App\Http\Controllers\Admin\ActivityLogController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('roster', [RosterController::class, 'index'])->name('roster.index');
        Route::get('roster/export', RosterExportController::class)->name('roster.export');
        Route::post('roster/exceptions', [RosterExceptionController::class, 'store'])->name('roster.exceptions.store');
        Route::delete('roster/exceptions', [RosterExceptionController::class, 'destroy'])->name('roster.exceptions.destroy');
    });

Route::middleware(['auth', 'verified', 'role:super_admin|supv'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('verifications', [\App\Http\Controllers\Admin\VerificationController::class, 'index'])->name('verifications.index');
        Route::post('verifications/{user}/verify', [\App\Http\Controllers\Admin\VerificationController::class, 'verify'])->name('verifications.verify');
    });

Route::middleware(['auth', 'verified', 'role:super_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('users/{user}/attendance', [UserController::class, 'attendance'])->name('users.attendance');
        Route::get('users/{user}/attendance/export', [UserController::class, 'attendanceExport'])->name('users.attendance.export');
        Route::get('users/{user}/tickets', [UserController::class, 'tickets'])->name('users.tickets');
        Route::get('users/{user}/tickets/export', [UserController::class, 'ticketsExport'])->name('users.tickets.export');
        Route::resource('users', UserController::class);
        Route::resource('companies', CompanyController::class);
        Route::resource('groups', GroupController::class);
        Route::resource('shifts', ShiftController::class);
        Route::get('schedule-logs', [ScheduleLogController::class, 'index'])->name('schedule-logs.index');
        Route::get('activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    });
