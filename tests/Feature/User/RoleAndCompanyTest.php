<?php

use App\Enums\RoleName;
use App\Http\Resources\UserResource;
use App\Models\Company;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('super admin has super_admin role and no company', function () {
    $user = User::query()->where('email', 'super@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->company_id)->toBeNull()
        ->and($user->hasRole(RoleName::SuperAdmin->value))->toBeTrue()
        ->and($user->getRoleNames())->toHaveCount(1);
});

test('supervisor and engineer have correct roles and company', function () {
    $company = Company::query()->where('slug', 'opstoday-hq')->first();

    $supv = User::query()->where('email', 'supv@example.com')->first();
    $engineer = User::query()->where('email', 'engineer@example.com')->first();

    expect($supv->company_id)->toBe($company->id)
        ->and($supv->hasRole(RoleName::Supv->value))->toBeTrue()
        ->and($engineer->company_id)->toBe($company->id)
        ->and($engineer->hasRole(RoleName::Engineer->value))->toBeTrue();
});

test('user resource includes role and company when loaded', function () {
    $user = User::query()
        ->where('email', 'supv@example.com')
        ->with(['roles', 'company'])
        ->first();

    $payload = UserResource::make($user)->resolve();

    expect($payload['role'])->toBe(RoleName::Supv->value)
        ->and($payload['company'])->toMatchArray([
            'id' => $user->company->id,
            'name' => 'OpsToday HQ',
            'slug' => 'opstoday-hq',
            'whatsapp_group_number' => '6281234567890',
        ]);
});

test('shared inertia auth user includes role and company', function () {
    $user = User::query()->where('email', 'engineer@example.com')->first();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('auth.user.role', RoleName::Engineer->value)
            ->where('auth.user.company.slug', 'opstoday-hq'));
});

test('assign role via repository replaces existing role', function () {
    $user = User::factory()->create();
    $repository = app(UserRepositoryInterface::class);

    $repository->assignRole($user, RoleName::Engineer);
    expect($user->fresh()->hasRole(RoleName::Engineer->value))->toBeTrue();

    $repository->assignRole($user, RoleName::Supv);
    $user->refresh();

    expect($user->hasRole(RoleName::Supv->value))->toBeTrue()
        ->and($user->hasRole(RoleName::Engineer->value))->toBeFalse()
        ->and($user->getRoleNames())->toHaveCount(1);
});
