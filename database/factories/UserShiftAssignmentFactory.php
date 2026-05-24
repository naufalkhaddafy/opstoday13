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
            'shift_id' => Shift::factory(),
            'effective_from' => now()->subYear()->toDateString(),
            'effective_to' => null,
            'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
        ];
    }
}
