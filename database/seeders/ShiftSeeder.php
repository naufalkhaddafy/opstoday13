<?php

namespace Database\Seeders;

use App\Enums\ShiftType;
use App\Enums\ShiftWorkDateRule;
use App\Models\Shift;
use Illuminate\Database\Seeder;

class ShiftSeeder extends Seeder
{
    /**
     * @var array<string, Shift>
     */
    public static array $shifts = [];

    public function run(): void
    {
        self::$shifts = [];

        self::$shifts['sore'] = Shift::query()->create([
            'code' => 'sore',
            'name' => 'Shift Sore',
            'start_time' => '15:00:00',
            'end_time' => '00:00:00',
            'is_overnight' => false,
            'work_date_rule' => ShiftWorkDateRule::CalendarDay,
            'grace_minutes' => 15,
            'type' => ShiftType::Shift,
        ]);

        self::$shifts['malam'] = Shift::query()->create([
            'code' => 'malam',
            'name' => 'Shift Malam',
            'start_time' => '23:00:00',
            'end_time' => '08:00:00',
            'is_overnight' => true,
            'work_date_rule' => ShiftWorkDateRule::NextDay,
            'grace_minutes' => 15,
            'type' => ShiftType::Shift,
        ]);

        self::$shifts['office'] = Shift::query()->create([
            'code' => 'office',
            'name' => 'Office Steady',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'is_overnight' => false,
            'work_date_rule' => ShiftWorkDateRule::CalendarDay,
            'grace_minutes' => 15,
            'type' => ShiftType::Steady,
        ]);
    }

    public static function get(string $code): ?Shift
    {
        return self::$shifts[$code] ?? null;
    }
}
