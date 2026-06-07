   <?php

use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\RosterController;
use App\Http\Controllers\Admin\RosterExceptionController;
use App\Http\Controllers\Admin\RosterExportController;
use App\Http\Controllers\Admin\ShiftController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:super_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('roster', [RosterController::class, 'index'])->name('roster.index');
        Route::get('roster/export', RosterExportController::class)->name('roster.export');
        Route::post('roster/exceptions', [RosterExceptionController::class, 'store'])->name('roster.exceptions.store');
        Route::delete('roster/exceptions', [RosterExceptionController::class, 'destroy'])->name('roster.exceptions.destroy');
        Route::get('users/{user}/attendance', [UserController::class, 'attendance'])->name('users.attendance');
        Route::get('users/{user}/tickets', [UserController::class, 'tickets'])->name('users.tickets');
        Route::resource('users', UserController::class);
        Route::resource('companies', CompanyController::class);
        Route::resource('groups', \App\Http\Controllers\Admin\GroupController::class);
        Route::resource('shifts', ShiftController::class);
    });
