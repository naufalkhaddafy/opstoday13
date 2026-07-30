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

        // ─── Placeholder generik (untuk assignment) ──────────────────────
        // Admin hanya memilih ini saat assign jadwal ke karyawan.
        // Jam riil ditentukan otomatis oleh auto-match.

        self::$shifts['steady'] = Shift::query()->updateOrCreate(
            ['code' => 'steady'],
            [
                'name' => 'Steady Day',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'is_overnight' => false,
                'work_date_rule' => ShiftWorkDateRule::CalendarDay,
                'grace_minutes' => 15,
                'type' => ShiftType::Steady,
            ]
        );

        self::$shifts['shift'] = Shift::query()->updateOrCreate(
            ['code' => 'shift'],
            [
                'name' => 'Shift',
                'start_time' => '15:00:00',
                'end_time' => '00:00:00',
                'is_overnight' => false,
                'work_date_rule' => ShiftWorkDateRule::CalendarDay,
                'grace_minutes' => 15,
                'type' => ShiftType::Shift,
            ]
        );

        // ─── Konfigurasi Steady riil (auto-match target) ─────────────────

        self::$shifts['pagi-7'] = Shift::query()->updateOrCreate(
            ['code' => 'pagi-7'],
            [
                'name' => 'Steady Pagi 07:00',
                'start_time' => '07:00:00',
                'end_time' => '16:00:00',
                'is_overnight' => false,
                'work_date_rule' => ShiftWorkDateRule::CalendarDay,
                'grace_minutes' => 15,
                'type' => ShiftType::Steady,
            ]
        );

        self::$shifts['pagi-8'] = Shift::query()->updateOrCreate(
            ['code' => 'pagi-8'],
            [
                'name' => 'Steady Pagi 08:00',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'is_overnight' => false,
                'work_date_rule' => ShiftWorkDateRule::CalendarDay,
                'grace_minutes' => 15,
                'type' => ShiftType::Steady,
            ]
        );

        self::$shifts['pagi-9'] = Shift::query()->updateOrCreate(
            ['code' => 'pagi-9'],
            [
                'name' => 'Steady Pagi 09:00',
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_overnight' => false,
                'work_date_rule' => ShiftWorkDateRule::CalendarDay,
                'grace_minutes' => 15,
                'type' => ShiftType::Steady,
            ]
        );

        // ─── Konfigurasi Shift riil (auto-match target) ──────────────────

        self::$shifts['sore'] = Shift::query()->updateOrCreate(
            ['code' => 'sore'],
            [
                'name' => 'Shift Sore',
                'start_time' => '15:00:00',
                'end_time' => '00:00:00',
                'is_overnight' => false,
                'work_date_rule' => ShiftWorkDateRule::CalendarDay,
                'grace_minutes' => 15,
                'type' => ShiftType::Shift,
            ]
        );

        self::$shifts['malam'] = Shift::query()->updateOrCreate(
            ['code' => 'malam'],
            [
                'name' => 'Shift Malam',
                'start_time' => '23:00:00',
                'end_time' => '08:00:00',
                'is_overnight' => true,
                'work_date_rule' => ShiftWorkDateRule::NextDay,
                'grace_minutes' => 15,
                'type' => ShiftType::Shift,
            ]
        );

        self::$shifts['event'] = Shift::query()->updateOrCreate(
            ['code' => 'event'],
            [
                'name' => 'Event / Kegiatan',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'is_overnight' => false,
                'work_date_rule' => ShiftWorkDateRule::CalendarDay,
                'grace_minutes' => 999,
                'type' => ShiftType::Shift,
            ]
        );
    }

    public static function get(string $code): ?Shift
    {
        return self::$shifts[$code] ?? null;
    }
}
