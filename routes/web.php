<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\PublicDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicDashboardController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('leaves', LeaveController::class);
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';

