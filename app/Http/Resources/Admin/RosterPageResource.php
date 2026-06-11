<?php

namespace App\Http\Resources\Admin;

use App\Repositories\Contracts\HolidayRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RosterPageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $users = $this->resource['users'];
        $companies = $this->resource['companies'];
        $startOfMonth = $this->resource['start_of_month'];
        $month = $this->resource['month'];
        $year = $this->resource['year'];
        $filters = $this->resource['filters'];
        $shiftResolver = $this->resource['shift_resolver'];

        $timezone = config('app.timezone');
        $daysInMonth = $startOfMonth->daysInMonth;
        
        $holidayRepo = app(HolidayRepositoryInterface::class);

        // Build array of month days (1 .. N)
        $monthDays = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayDate = CarbonImmutable::create($year, $month, $d, 0, 0, 0, $timezone);
            $dateString = $dayDate->toDateString();
            $monthDays[] = [
                'date' => $dateString,
                'day' => $d,
                'day_name' => $this->getDayNameIndo($dayDate->dayOfWeekIso),
                'day_name_short' => $this->getDayNameShort($dayDate->dayOfWeekIso),
                'is_weekend' => $dayDate->dayOfWeekIso >= 6,
                'is_holiday' => $holidayRepo->isHoliday($dateString),
            ];
        }

        // Resolve roster for each user
        $rosterData = [];
        foreach ($users as $user) {
            $schedule = [];
            foreach ($monthDays as $day) {
                $workDate = CarbonImmutable::parse($day['date'], $timezone);
                $shift = $shiftResolver->shiftForWorkDate($user, $workDate);

                $isException = false;
                if ($user->relationLoaded('exceptions')) {
                    $dateStr = $workDate->toDateString();
                    $exception = $user->exceptions->first(fn($e) => $e->date->toDateString() === $dateStr);
                    $isException = $exception !== null;
                }

                $activeLeave = null;
                if ($user->relationLoaded('leaves')) {
                    $dateStr = $workDate->toDateString();
                    $leave = $user->leaves->first(function ($l) use ($dateStr) {
                        return $l->start_date->toDateString() <= $dateStr && $l->end_date->toDateString() >= $dateStr;
                    });
                    if ($leave) {
                        $activeLeave = [
                            'type' => $leave->type,
                            'description' => $leave->description,
                        ];
                    }
                }

                $schedule[] = [
                    'date' => $day['date'],
                    'is_exception' => $isException,
                    'is_holiday' => $day['is_holiday'],
                    'leave' => $activeLeave,
                    'shift' => $shift ? [
                        'id' => $shift->id,
                        'code' => $shift->code,
                        'name' => $shift->name,
                        'start_time' => substr($shift->start_time, 0, 5),
                        'end_time' => substr($shift->end_time, 0, 5),
                        'type' => $shift->type->value,
                    ] : null,
                ];
            }

            $rosterData[] = [
                'id' => $user->id,
                'name' => $user->name,
                'employee_id' => $user->employee_id,
                'company' => $user->company ? [
                    'id' => $user->company->id,
                    'name' => $user->company->name,
                ] : null,
                'group' => $user->group ? [
                    'id' => $user->group->id,
                    'name' => $user->group->name,
                ] : null,
                'schedule' => $schedule,
            ];
        }

        // Month names in Indonesian
        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
            4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September',
            10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        return [
            'roster' => $rosterData,
            'month_days' => $monthDays,
            'month' => $month,
            'year' => $year,
            'month_name' => $monthNames[$month] ?? '',
            'shifts' => $this->resource['shifts']->toArray(),
            'companies' => array_map(fn ($c) => [
                'id' => $c['id'],
                'name' => $c['name'],
            ], $companies->toArray()),
            'groups' => $this->resource['groups']->toArray(),
            'filters' => $filters,
        ];
    }

    private function getDayNameIndo(int $dayOfWeekIso): string
    {
        $names = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Minggu',
        ];
        return $names[$dayOfWeekIso] ?? '';
    }

    private function getDayNameShort(int $dayOfWeekIso): string
    {
        $names = [
            1 => 'Sen',
            2 => 'Sel',
            3 => 'Rab',
            4 => 'Kam',
            5 => 'Jum',
            6 => 'Sab',
            7 => 'Min',
        ];
        return $names[$dayOfWeekIso] ?? '';
    }
}
