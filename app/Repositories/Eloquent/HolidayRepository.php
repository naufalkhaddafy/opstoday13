<?php

namespace App\Repositories\Eloquent;

use App\Models\Holiday;
use App\Repositories\Contracts\HolidayRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class HolidayRepository implements HolidayRepositoryInterface
{
    public const CACHE_KEY = 'holidays_dates';

    public function getAll(): Collection
    {
        return Holiday::orderByDesc('date')->get();
    }

    public function findById(int $id): ?Holiday
    {
        return Holiday::find($id);
    }

    public function create(array $data): Holiday
    {
        $holiday = Holiday::create($data);
        Cache::forget(self::CACHE_KEY);
        return $holiday;
    }

    public function update(Holiday $holiday, array $data): bool
    {
        $updated = $holiday->update($data);
        if ($updated) {
            Cache::forget(self::CACHE_KEY);
        }
        return $updated;
    }

    public function delete(Holiday $holiday): bool
    {
        $deleted = $holiday->delete();
        if ($deleted) {
            Cache::forget(self::CACHE_KEY);
        }
        return $deleted;
    }

    public function getHolidayName(string $date): ?string
    {
        $holidays = Cache::rememberForever(self::CACHE_KEY, function () {
            return Holiday::select('name', 'date', 'is_recurrent')->get()->map(function($h) {
                return [
                    'name' => $h->name,
                    'date' => $h->date->toDateString(),
                    'is_recurrent' => $h->is_recurrent,
                ];
            })->toArray();
        });

        $checkDate = \Carbon\CarbonImmutable::parse($date);
        
        foreach ($holidays as $h) {
            $hDate = \Carbon\CarbonImmutable::parse($h['date']);
            if ($h['is_recurrent']) {
                if ($hDate->month === $checkDate->month && $hDate->day === $checkDate->day) {
                    return $h['name'];
                }
            } else {
                if ($h['date'] === $date) {
                    return $h['name'];
                }
            }
        }

        return null;
    }

    public function isHoliday(string $date): bool
    {
        return $this->getHolidayName($date) !== null;
    }
}
