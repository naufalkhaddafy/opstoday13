<?php

namespace App\Observers;

use App\Models\Company;
use Illuminate\Support\Facades\Cache;

class CompanyObserver
{
    /**
     * Handle the Company "saved" event.
     */
    public function saved(Company $company): void
    {
        Cache::forget('companies.all');
    }

    /**
     * Handle the Company "deleted" event.
     */
    public function deleted(Company $company): void
    {
        Cache::forget('companies.all');
    }
}
