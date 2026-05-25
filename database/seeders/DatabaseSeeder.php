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
            ShiftSeeder::class,
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

        // Query shifts for assignments
        $officeShift = \App\Models\Shift::query()->where('company_id', $company->id)->where('code', 'office')->first();
        $soreShift = \App\Models\Shift::query()->where('company_id', $company->id)->where('code', 'sore')->first();
        $malamShift = \App\Models\Shift::query()->where('company_id', $company->id)->where('code', 'malam')->first();

        // Seed dummy users matching dummy-backend data
        $dummyEmployees = [
            [
                'employee_id' => '00012497',
                'name' => 'Sutisna Hariyanto',
                'email' => 'sutisna@example.com',
                'shift' => $officeShift,
            ],
            [
                'employee_id' => '00013411',
                'name' => 'Rahmaniati',
                'email' => 'rahmaniati@example.com',
                'shift' => $officeShift,
            ],
            [
                'employee_id' => '00014022',
                'name' => 'Ahmad Fauzi',
                'email' => 'fauzi@example.com',
                'shift' => $officeShift,
            ],
            [
                'employee_id' => '00011503',
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'shift' => $officeShift,
            ],
            [
                'employee_id' => '00012894',
                'name' => 'Dewi Lestari',
                'email' => 'dewi@example.com',
                'shift' => $officeShift,
            ],
            [
                'employee_id' => '00013145',
                'name' => 'Eko Prasetyo',
                'email' => 'eko@example.com',
                'shift' => $officeShift,
            ],
            [
                'employee_id' => '00014356',
                'name' => 'Fitriani',
                'email' => 'fitriani@example.com',
                'shift' => $soreShift,
            ],
            [
                'employee_id' => '00012089',
                'name' => 'Gunawan Wibisono',
                'email' => 'gunawan@example.com',
                'shift' => $soreShift,
            ],
            [
                'employee_id' => '00013912',
                'name' => 'Hariyanto',
                'email' => 'hariyanto@example.com',
                'shift' => $malamShift,
            ],
            [
                'employee_id' => '00014567',
                'name' => 'Indah Permatasari',
                'email' => 'indah@example.com',
                'shift' => $malamShift,
            ],
        ];

        foreach ($dummyEmployees as $emp) {
            $user = User::factory()->forCompany($company)->create([
                'name' => $emp['name'],
                'email' => $emp['email'],
                'employee_id' => $emp['employee_id'],
            ])->syncRoles([RoleName::Engineer->value]);

            if ($emp['shift'] !== null) {
                \App\Models\UserShiftAssignment::factory()->create([
                    'user_id' => $user->id,
                    'shift_id' => $emp['shift']->id,
                ]);
            }
        }
    }
}
