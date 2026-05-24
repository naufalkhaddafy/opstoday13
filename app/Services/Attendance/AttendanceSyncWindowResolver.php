<?php

namespace App\Services\Attendance;

use Carbon\CarbonImmutable;

class AttendanceSyncWindowResolver
{
    public function __construct(
        protected string $timezone = 'Asia/Jakarta',
    ) {}

    /**
     * @return array{window_from: CarbonImmutable, window_to: CarbonImmutable, rebuild_dates: list<CarbonImmutable>, allow_absent_marking: bool}
     */
    public function resolve(CarbonImmutable $now): array
    {
        $now = $now->timezone($this->timezone);
        $hour = $now->hour;
        $minute = $now->minute;

        if ($hour === 9 && $minute < 45) {
            return [
                'window_from' => $now->subDays(2)->startOfDay(),
                'window_to' => $now,
                'rebuild_dates' => [
                    $now->startOfDay(),
                    $now->subDay()->startOfDay(),
                ],
                'allow_absent_marking' => true,
            ];
        }

        if ($hour === 23 && $minute >= 25) {
            return [
                'window_from' => $now->subDay()->startOfDay(),
                'window_to' => $now,
                'rebuild_dates' => [
                    $now->startOfDay(),
                    $now->addDay()->startOfDay(),
                ],
                'allow_absent_marking' => false,
            ];
        }

        return [
            'window_from' => $now->subDay()->startOfDay(),
            'window_to' => $now,
            'rebuild_dates' => [
                $now->startOfDay(),
            ],
            'allow_absent_marking' => false,
        ];
    }
}
