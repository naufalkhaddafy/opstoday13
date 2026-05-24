<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            CompanySeeder::class,
        ]);

        $company = CompanySeeder::$companies[0];

        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'super@example.com',
            'company_id' => null,
            'employee_id' => null,
            'is_verified' => true,
            'is_active' => true,
        ])->syncRoles([RoleName::SuperAdmin->value]);

        User::factory()->forCompany($company)->create([
            'name' => 'Supervisor',
            'email' => 'supv@example.com',
            'employee_id' => 'EMP-00001',
        ])->syncRoles([RoleName::Supv->value]);

        User::factory()->forCompany($company)->create([
            'name' => 'Engineer',
            'email' => 'engineer@example.com',
            'employee_id' => 'EMP-00002',
        ])->syncRoles([RoleName::Engineer->value]);
    }
}
