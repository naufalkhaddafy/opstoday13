<?php

namespace App\Jobs;

use App\Services\Ticket\TicketSyncService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ReconcileCompletedTicketsJob implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    /**
     * Keep the job unique for a short window so a burst of disappearing tickets
     * only triggers a single completed reconciliation.
     */
    public int $uniqueFor = 300;

    public function uniqueId(): string
    {
        return 'tickets:reconcile-completed';
    }

    public function handle(TicketSyncService $syncService): void
    {
        $syncService->syncCompleted();
    }
}
