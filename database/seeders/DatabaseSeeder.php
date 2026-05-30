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
            GroupSeeder::class,
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

        // Query placeholder shifts for assignments
        $steadyPlaceholder = \App\Models\Shift::query()->where('code', 'steady')->first();
        $shiftPlaceholder = \App\Models\Shift::query()->where('code', 'shift')->first();

        // Seed dummy users matching dummy-backend data
        $dummyEmployees = [
            ['employee_id' => 'Z23123', 'name' => 'Bayu', 'email' => 'bayu@example.com', 'shift' => $shiftPlaceholder],
            ['employee_id' => 'Z23124', 'name' => 'Adam', 'email' => 'adam@example.com', 'shift' => $shiftPlaceholder],
            ['employee_id' => 'Z23125', 'name' => 'Agung', 'email' => 'agung@example.com', 'shift' => $shiftPlaceholder],
            ['employee_id' => 'Z23126', 'name' => 'Whyndi Dwi Chananta', 'email' => 'whyndi@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z23127', 'name' => 'Burhanudin', 'email' => 'burhanudin@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z23128', 'name' => 'Naufal', 'email' => 'naufal@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z23129', 'name' => 'Kukuh Raharja', 'email' => 'kukuh@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z23130', 'name' => 'Koko Yuardi', 'email' => 'koko@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z23131', 'name' => 'Oby Teguh Adi Prasetyo', 'email' => 'oby@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z23132', 'name' => 'Abdul Saleh Arifin', 'email' => 'abdul@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z23133', 'name' => 'Rahmat Novian Nur', 'email' => 'rahmat@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z23134', 'name' => 'Yusuf Satria Borneo', 'email' => 'yusuf@example.com', 'shift' => $steadyPlaceholder],
        ];

        foreach ($dummyEmployees as $emp) {
            $user = User::factory()->create([
                'name' => $emp['name'],
                'email' => $emp['email'],
                'employee_id' => $emp['employee_id'],
            ])->syncRoles([RoleName::Engineer->value]);

            if ($emp['shift'] !== null) {
                \App\Models\UserShiftAssignment::factory()->create([
                    'user_id' => $user->id,
                    'schedule' => [
                        1 => $emp['shift']->id,
                        2 => $emp['shift']->id,
                        3 => $emp['shift']->id,
                        4 => $emp['shift']->id,
                        5 => $emp['shift']->id,
                        6 => null,
                        7 => null,
                    ],
                ]);
            }
        }
    }
}
