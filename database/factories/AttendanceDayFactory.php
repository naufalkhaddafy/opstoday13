<?php

namespace Database\Factories;

use App\Enums\AttendancePresenceStatus;
use App\Models\AttendanceDay;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceDay>
 */
class AttendanceDayFactory extends Factory
{
    protected $model = AttendanceDay::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory()->create();

        return [
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'work_date' => now()->toDateString(),
            'shift_id' => null,
            'check_in_at' => null,
            'check_out_at' => null,
            'presence_status' => AttendancePresenceStatus::TidakHadir,
            'timing_status' => null,
            'late_minutes' => 0,
            'early_leave_minutes' => 0,
            'overtime_minutes' => 0,
            'computed_at' => now(),
        ];
    }
}
