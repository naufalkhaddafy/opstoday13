<?php

namespace App\Contracts\Fingerprint;

use Carbon\CarbonImmutable;

interface FingerprintClientInterface
{
    /**
     * @return list<array{employee_id: string, status: string, punched_at: CarbonImmutable}>
     */
    public function fetch(CarbonImmutable $from, CarbonImmutable $to): array;
}
