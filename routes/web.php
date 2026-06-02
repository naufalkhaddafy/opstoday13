<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('leaves', \App\Http\Controllers\LeaveController::class);
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';

