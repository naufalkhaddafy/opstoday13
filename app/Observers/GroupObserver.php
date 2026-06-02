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
        Cache::forget('groups.all');
        Cache::forget('groups.all_select');
    }

    /**
     * Handle the Group "deleted" event.
     */
    public function deleted(Group $group): void
    {
        Cache::forget('groups.all');
        Cache::forget('groups.all_select');
    }
}
