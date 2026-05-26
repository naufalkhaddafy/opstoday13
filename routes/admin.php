   <?php

use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\ShiftController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:super_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('users/{user}/attendance', [UserController::class, 'attendance'])->name('users.attendance');
        Route::resource('users', UserController::class);
        Route::resource('companies', CompanyController::class);
        Route::resource('shifts', ShiftController::class);
    });



