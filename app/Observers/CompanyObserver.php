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
        try {
            Cache::store('redis')->forget('companies.all');
        } catch (\Exception $e) {}
    }

    /**
     * Handle the Company "deleted" event.
     */
    public function deleted(Company $company): void
    {
        try {
            Cache::store('redis')->forget('companies.all');
        } catch (\Exception $e) {}
    }
}
