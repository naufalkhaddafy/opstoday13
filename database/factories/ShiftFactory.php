<?php

namespace Database\Factories;

use App\Enums\ShiftType;
use App\Enums\ShiftWorkDateRule;
use App\Models\Company;
use App\Models\Shift;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Shift>
 */
class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'code' => fake()->unique()->lexify('shift-????'),
            'name' => fake()->words(2, true),
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'is_overnight' => false,
            'work_date_rule' => ShiftWorkDateRule::CalendarDay,
            'grace_minutes' => 15,
            'type' => ShiftType::Shift,
        ];
    }

    public function sore(): static
    {
        return $this->state(fn (): array => [
            'code' => 'sore',
            'name' => 'Shift Sore',
            'start_time' => '15:00:00',
            'end_time' => '00:00:00',
            'is_overnight' => false,
            'work_date_rule' => ShiftWorkDateRule::CalendarDay,
        ]);
    }

    public function malam(): static
    {
        return $this->state(fn (): array => [
            'code' => 'malam',
            'name' => 'Shift Malam',
            'start_time' => '23:00:00',
            'end_time' => '08:00:00',
            'is_overnight' => true,
            'work_date_rule' => ShiftWorkDateRule::NextDay,
        ]);
    }

    public function office(): static
    {
        return $this->state(fn (): array => [
            'code' => 'office',
            'name' => 'Office Steady',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'is_overnight' => false,
            'work_date_rule' => ShiftWorkDateRule::CalendarDay,
            'type' => ShiftType::Steady,
        ]);
    }
}
