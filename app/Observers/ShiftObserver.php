<?php

namespace App\Observers;

use App\Models\Shift;
use Illuminate\Support\Facades\Cache;

class ShiftObserver
{
    /**
     * Handle the Shift "saved" event.
     */
    public function saved(Shift $shift): void
    {
        try {
            Cache::store('redis')->forget('shifts.all');
        } catch (\Exception $e) {}
    }

    /**
     * Handle the Shift "deleted" event.
     */
    public function deleted(Shift $shift): void
    {
        try {
            Cache::store('redis')->forget('shifts.all');
        } catch (\Exception $e) {}
    }
}
