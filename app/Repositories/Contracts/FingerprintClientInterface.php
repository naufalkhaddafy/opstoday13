<?php

namespace App\Repositories\Contracts;

use Carbon\CarbonImmutable;

interface FingerprintClientInterface
{
    /**
     * @return list<array{employee_id: string, status: string, punched_at: CarbonImmutable}>
     */
    public function fetch(): array;
}
