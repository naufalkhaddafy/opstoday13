<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // SLA KPC Group
            ['group' => 'SLA KPC', 'key' => 'sla_response_time_green', 'value' => '60', 'type' => 'integer', 'description' => 'Response time threshold (menit) — hijau jika <= ini'],
            ['group' => 'SLA KPC', 'key' => 'sla_resolution_time_green', 'value' => '120', 'type' => 'integer', 'description' => 'Resolution time threshold (menit) — hijau jika <= ini'],
            ['group' => 'SLA KPC', 'key' => 'sla_work_duration_hours', 'value' => '8', 'type' => 'integer', 'description' => 'Work duration target (jam)'],
            ['group' => 'SLA KPC', 'key' => 'sla_aging_days', 'value' => '3', 'type' => 'integer', 'description' => 'Aging ticket threshold (hari)'],
            ['group' => 'SLA KPC', 'key' => 'sla_high_ticket_load', 'value' => '10', 'type' => 'integer', 'description' => 'High ticket load threshold dalam 24 jam'],
            ['group' => 'SLA KPC', 'key' => 'attendance_late_grace_minutes', 'value' => '0', 'type' => 'integer', 'description' => 'Toleransi keterlambatan dalam menit'],

            // Scheduler Group
            ['group' => 'Scheduler', 'key' => 'wa_morning_schedule', 'value' => '10:00', 'type' => 'string', 'description' => 'Jadwal Ops Snapshot Morning'],
            ['group' => 'Scheduler', 'key' => 'wa_evening_schedule', 'value' => '19:00', 'type' => 'string', 'description' => 'Jadwal Ops Snapshot Evening'],
            ['group' => 'Scheduler', 'key' => 'sync_open_tickets_interval', 'value' => '1', 'type' => 'integer', 'description' => 'Interval sinkronisasi tiket open (menit)'],
            ['group' => 'Scheduler', 'key' => 'sync_attendance_interval', 'value' => '1', 'type' => 'integer', 'description' => 'Interval sinkronisasi absensi (menit)'],
            ['group' => 'Scheduler', 'key' => 'sync_completed_tickets_cron', 'value' => '0 6,18 * * *', 'type' => 'string', 'description' => 'Cron interval sinkronisasi tiket completed'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
