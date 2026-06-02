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
        Cache::forget('shifts.all');
    }

    /**
     * Handle the Shift "deleted" event.
     */
    public function deleted(Shift $shift): void
    {
        Cache::forget('shifts.all');
    }
}
