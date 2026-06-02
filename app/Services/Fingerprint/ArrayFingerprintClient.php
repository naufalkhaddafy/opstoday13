<?php

namespace App\Services\Fingerprint;

use App\Repositories\Contracts\FingerprintClientInterface;
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
    public function fetch(): array
    {
        return array_values(array_filter(
            $this->records,
            fn (array $record): bool => $record['status'] !== AttendanceLogStatus::Absen->value,
        ));
    }
}
