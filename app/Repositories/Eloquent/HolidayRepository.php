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
                    'month' => (int) $h->date->format('m'),
                    'day' => (int) $h->date->format('d'),
                    'is_recurrent' => (bool) $h->is_recurrent,
                ];
            })->toArray();
        });

        $month = (int) substr($date, 5, 2);
        $day = (int) substr($date, 8, 2);
        
        foreach ($holidays as $h) {
            if ($h['is_recurrent']) {
                if (($h['month'] ?? 0) === $month && ($h['day'] ?? 0) === $day) {
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
