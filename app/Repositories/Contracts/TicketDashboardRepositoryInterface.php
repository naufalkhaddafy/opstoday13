<?php

namespace App\Repositories\Contracts;

use Carbon\CarbonImmutable;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface TicketDashboardRepositoryInterface
{
    /**
     * Daftar tiket terbaru (desc) dalam rentang tanggal & company opsional.
     */
    public function paginateLatest(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
        int $perPage = 10,
        ?string $search = null,
        ?string $sortBy = null,
        ?string $sortDir = 'desc',
        ?string $status = null,
    ): LengthAwarePaginator;

    /**
     * Ringkasan beban tiket per engineer dalam rentang tanggal & company opsional.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function engineerSummaries(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
    ): Collection;

    /**
     * Statistik global tiket dalam rentang tanggal & company opsional.
     *
     * @return array<string, int>
     */
    public function globalStats(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
    ): array;

    /**
     * @return array<string, mixed>
     */
    public function kpiStats(
        CarbonImmutable $dateFrom,
        CarbonImmutable $dateTo,
        ?int $companyId = null,
        ?int $responseSlaSeconds = null,
        ?float $resolutionSlaHours = null,
    ): array;
}
