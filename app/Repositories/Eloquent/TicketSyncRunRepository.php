<?php

namespace App\Repositories\Eloquent;

use App\Enums\TicketSyncRunKind;
use App\Enums\TicketSyncRunStatus;
use App\Models\TicketSyncRun;
use App\Repositories\Contracts\TicketSyncRunRepositoryInterface;

class TicketSyncRunRepository implements TicketSyncRunRepositoryInterface
{
    public function start(TicketSyncRunKind $kind): TicketSyncRun
    {
        return TicketSyncRun::query()->create([
            'kind' => $kind,
            'started_at' => now(),
            'status' => TicketSyncRunStatus::Running,
        ]);
    }

    public function finish(
        TicketSyncRun $run,
        TicketSyncRunStatus $status,
        int $fetched,
        int $inserted,
        int $updated,
        int $skipped,
        ?string $errorMessage = null,
    ): TicketSyncRun {
        $run->update([
            'finished_at' => now(),
            'status' => $status,
            'fetched_count' => $fetched,
            'inserted_count' => $inserted,
            'updated_count' => $updated,
            'skipped_count' => $skipped,
            'error_message' => $errorMessage,
        ]);

        return $run->fresh();
    }
}
