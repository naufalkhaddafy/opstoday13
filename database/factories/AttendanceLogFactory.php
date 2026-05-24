<?php

namespace Database\Factories;

use App\Enums\AttendanceLogStatus;
use App\Models\AttendanceLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceLog>
 */
class AttendanceLogFactory extends Factory
{
    protected $model = AttendanceLog::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory()->create();

        return [
            'employee_id' => $user->employee_id ?? fake()->numerify('#####'),
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'status' => AttendanceLogStatus::Hadir,
            'punched_at' => now(),
            'work_date' => now()->toDateString(),
            'sync_batch_id' => null,
            'created_at' => now(),
        ];
    }
}
