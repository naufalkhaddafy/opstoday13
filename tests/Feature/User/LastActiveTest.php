<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

test('login updates last active at', function () {
    $user = User::factory()->create([
        'last_active_at' => null,
    ]);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    expect($user->fresh()->last_active_at)->not->toBeNull();
});

test('authenticated request updates last active at with throttle', function () {
    Cache::flush();

    $user = User::factory()->create([
        'last_active_at' => now()->subHour(),
    ]);

    $original = $user->last_active_at;

    $this->actingAs($user)->get(route('dashboard'));

    expect($user->fresh()->last_active_at)->not->toEqual($original);

    $afterFirst = $user->fresh()->last_active_at;

    $this->actingAs($user)->get(route('dashboard'));

    expect($user->fresh()->last_active_at)->toEqual($afterFirst);
});
