<?php

namespace App\Repositories\Contracts;

use App\Enums\TicketSyncRunKind;
use App\Enums\TicketSyncRunStatus;
use App\Models\TicketSyncRun;

interface TicketSyncRunRepositoryInterface
{
    public function start(TicketSyncRunKind $kind): TicketSyncRun;

    public function finish(
        TicketSyncRun $run,
        TicketSyncRunStatus $status,
        int $fetched,
        int $inserted,
        int $updated,
        int $skipped,
        ?string $errorMessage = null,
    ): TicketSyncRun;
}
