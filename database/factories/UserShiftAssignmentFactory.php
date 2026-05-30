<?php

namespace Database\Factories;

use App\Models\Shift;
use App\Models\User;
use App\Models\UserShiftAssignment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserShiftAssignment>
 */
class UserShiftAssignmentFactory extends Factory
{
    protected $model = UserShiftAssignment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'schedule' => function () {
                $shift = Shift::first() ?: Shift::factory()->create();
                return [
                    1 => $shift->id,
                    2 => $shift->id,
                    3 => $shift->id,
                    4 => $shift->id,
                    5 => $shift->id,
                    6 => null,
                    7 => null,
                ];
            },
            'effective_from' => now()->month(5)->startOfMonth()->toDateString(),
            'effective_to' => null,
        ];
    }
}
