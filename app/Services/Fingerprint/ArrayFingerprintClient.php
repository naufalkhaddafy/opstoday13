<?php

namespace App\Services\Fingerprint;

use App\Contracts\Fingerprint\FingerprintClientInterface;
use Carbon\CarbonImmutable;

class ArrayFingerprintClient implements FingerprintClientInterface
{
    /**
     * @param  list<array{employee_id: string, status: string, punched_at: CarbonImmutable}>  $records
     */
    public function __construct(
        protected array $records = [],
    ) {}

    /**
     * @return list<array{employee_id: string, status: string, punched_at: CarbonImmutable}>
     */
    public function fetch(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return array_values(array_filter(
            $this->records,
            fn (array $record): bool => $record['punched_at']->gte($from) && $record['punched_at']->lte($to),
        ));
    }
}
