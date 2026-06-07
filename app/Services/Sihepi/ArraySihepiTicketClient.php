<?php

namespace App\Services\Sihepi;

use App\Repositories\Contracts\SihepiTicketClientInterface;

class ArraySihepiTicketClient implements SihepiTicketClientInterface
{
    /**
     * @param  array<string, list<array<string, mixed>>>  $openByTechnician  Keyed by employee id.
     * @param  list<array<string, mixed>>  $completed
     */
    public function __construct(
        protected array $openByTechnician = [],
        protected array $completed = [],
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function fetchOpenFor(string $employeeId): array
    {
        return array_values($this->openByTechnician[$employeeId] ?? []);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function fetchCompleted(): array
    {
        return array_values($this->completed);
    }
}
