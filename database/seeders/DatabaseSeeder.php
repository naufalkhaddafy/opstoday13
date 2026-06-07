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

        // Query placeholder shifts for assignments
        $steadyPlaceholder = \App\Models\Shift::query()->where('code', 'steady')->first();
        $shiftPlaceholder = \App\Models\Shift::query()->where('code', 'shift')->first();

        // 2. Supervisor (1 orang)
        $supervisors = [
            ['employee_id' => 'Z23123', 'name' => 'Bayu (SPV)', 'email' => 'bayu@example.com', 'shift' => $shiftPlaceholder],
        ];

        foreach ($supervisors as $emp) {
            $user = User::factory()->forCompany($company)->create([
                'name' => $emp['name'],
                'email' => $emp['email'],
                'employee_id' => $emp['employee_id'],
                'is_verified' => true,
                'is_active' => true,
            ])->syncRoles([RoleName::Supv->value]);

            if ($emp['shift'] !== null) {
                \App\Models\UserShiftAssignment::factory()->create([
                    'user_id' => $user->id,
                    'schedule' => array_fill(1, 5, $emp['shift']->id) + [6 => null, 7 => null],
                ]);
            }
        }

        // 3. Engineer (3 orang)
        $engineers = [
            ['employee_id' => 'Z100101', 'name' => 'Naufal (DSO - IT)', 'email' => 'naufal@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z109553', 'name' => 'Burhanudin (DSO-IT)', 'email' => 'burhanudin@example.com', 'shift' => $steadyPlaceholder],
            ['employee_id' => 'Z129984', 'name' => 'Koko Yuadi (DSO - IT)', 'email' => 'koko@example.com', 'shift' => $steadyPlaceholder],
        ];

        foreach ($engineers as $emp) {
            $user = User::factory()->forCompany($company)->create([
                'name' => $emp['name'],
                'email' => $emp['email'],
                'employee_id' => $emp['employee_id'],
                'is_verified' => true,
                'is_active' => true,
            ])->syncRoles([RoleName::Engineer->value]);

            if ($emp['shift'] !== null) {
                \App\Models\UserShiftAssignment::factory()->create([
                    'user_id' => $user->id,
                    'schedule' => array_fill(1, 5, $emp['shift']->id) + [6 => null, 7 => null],
                ]);
            }
        }
    }
}
