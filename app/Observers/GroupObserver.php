<?php

namespace App\Observers;

use App\Models\Group;
use Illuminate\Support\Facades\Cache;

class GroupObserver
{
    /**
     * Handle the Group "saved" event.
     */
    public function saved(Group $group): void
    {
        try {
            Cache::store('redis')->forget('groups.all');
            Cache::store('redis')->forget('groups.all_select');
        } catch (\Exception $e) {}
    }

    /**
     * Handle the Group "deleted" event.
     */
    public function deleted(Group $group): void
    {
        try {
            Cache::store('redis')->forget('groups.all');
            Cache::store('redis')->forget('groups.all_select');
        } catch (\Exception $e) {}
    }
}
