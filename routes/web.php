<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\PublicDashboardController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicDashboardController::class, 'index'])->name('home');
Route::get('/export', [PublicDashboardController::class, 'export'])->name('home.export');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('leaves', LeaveController::class);
    Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::get('attendance/export', [AttendanceController::class, 'export'])->name('attendance.export');
    Route::get('tickets', [TicketController::class, 'index'])->name('tickets.index');
    Route::get('tickets/export', [TicketController::class, 'export'])->name('tickets.export');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';

Route::get('/auth/microsoft', [\App\Http\Controllers\Auth\AzureAuthController::class, 'redirect'])->name('auth.azure');
Route::get('/auth/microsoft/callback', [\App\Http\Controllers\Auth\AzureAuthController::class, 'callback']);
