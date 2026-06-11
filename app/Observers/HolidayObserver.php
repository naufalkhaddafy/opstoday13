<?php

namespace App\Observers;

use App\Models\Holiday;
use App\Repositories\Eloquent\HolidayRepository;
use Illuminate\Support\Facades\Cache;

class HolidayObserver
{
    /**
     * Handle the Holiday "created" event.
     */
    public function created(Holiday $holiday): void
    {
        Cache::forget(HolidayRepository::CACHE_KEY);
    }

    /**
     * Handle the Holiday "updated" event.
     */
    public function updated(Holiday $holiday): void
    {
        Cache::forget(HolidayRepository::CACHE_KEY);
    }

    /**
     * Handle the Holiday "deleted" event.
     */
    public function deleted(Holiday $holiday): void
    {
        Cache::forget(HolidayRepository::CACHE_KEY);
    }

    /**
     * Handle the Holiday "restored" event.
     */
    public function restored(Holiday $holiday): void
    {
        Cache::forget(HolidayRepository::CACHE_KEY);
    }

    /**
     * Handle the Holiday "force deleted" event.
     */
    public function forceDeleted(Holiday $holiday): void
    {
        Cache::forget(HolidayRepository::CACHE_KEY);
    }
}
