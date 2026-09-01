<?php

namespace App\Services\Ticket;

use App\Enums\TicketSyncRunKind;
use App\Enums\TicketSyncRunStatus;
use App\Enums\RoleName;
use Illuminate\Database\Eloquent\Builder;
use App\Jobs\ReconcileCompletedTicketsJob;
use App\Models\Ticket;
use App\Models\TicketSyncRun;
use App\Models\User;
use App\Repositories\Contracts\SihepiTicketClientInterface;
use App\Enums\TicketStatus;
use App\Repositories\Contracts\TicketRepositoryInterface;
use App\Repositories\Contracts\TicketSyncRunRepositoryInterface;
use Illuminate\Support\Facades\Cache;

class TicketSyncService
{
    public function __construct(
        protected SihepiTicketClientInterface $client,
        protected TicketRepositoryInterface $ticketRepository,
        protected TicketSyncRunRepositoryInterface $syncRunRepository,
    ) {}

    /**
     * Sync open/active tickets for every technician (Z-format employee id).
     * Runs every minute.
     */
    public function syncOpen(): TicketSyncRun
    {
        $run = $this->syncRunRepository->start(TicketSyncRunKind::Open);

        try {
            $fetched = 0;
            $inserted = 0;
            $updated = 0;
            $skipped = 0;
            $seen = [];

            $technicians = User::query()
                ->whereNotNull('employee_id')
                ->where('is_active', true)
                ->pluck('employee_id');

            foreach ($technicians as $employeeId) {
                foreach ($this->client->fetchOpenFor($employeeId) as $record) {
                    $fetched++;

                    if (empty($record['ticket_no'])) {
                        $skipped++;

                        continue;
                    }

                    $seen[] = $record['ticket_no'];

                    $cachedTicket = null;
                    try {
                        $cachedTicket = Cache::store('redis')->get('ticket:' . $record['ticket_no']);
                    } catch (\Throwable $e) {
                        // Jika Redis mati, abaikan error dan anggap cache tidak ada (bypass ke DB)
                    }

                    if (is_array($cachedTicket)) {
                        $cachedStatus = $cachedTicket['status'] instanceof TicketStatus
                            ? $cachedTicket['status']->value
                            : $cachedTicket['status'];
                            
                        $incomingStatus = $record['status'] instanceof TicketStatus 
                            ? $record['status']->value 
                            : $record['status'];
                            
                        $isUnchanged = 
                            $cachedStatus === $incomingStatus &&
                            ($cachedTicket['assigned_to_id'] ?? null) === ($record['assigned_to_id'] ?? null) &&
                            ($cachedTicket['title'] ?? null) === ($record['title'] ?? null);

                        if ($isUnchanged) {
                            $skipped++;
                            continue;
                        }
                    }

                    if ($this->ticketRepository->upsertOpen($record, $employeeId, $run)) {
                        $inserted++;
                    } else {
                        $updated++;
                    }
                }
            }

            $disappeared = $this->ticketRepository->markDisappeared(array_values(array_unique($seen)));

            if ($disappeared > 0) {
                ReconcileCompletedTicketsJob::dispatch();
            }

            return $this->syncRunRepository->finish(
                $run,
                TicketSyncRunStatus::Success,
                $fetched,
                $inserted,
                $updated,
                $skipped,
            );
        } catch (\Throwable $exception) {
            $this->syncRunRepository->finish(
                $run,
                TicketSyncRunStatus::Failed,
                0,
                0,
                0,
                0,
                $exception->getMessage(),
            );

            throw $exception;
        }
    }

    /**
     * Reconcile completed tickets. Pulls the full list (no API filter) and keeps only
     * tickets relevant to our technicians or ones we already track.
     * Runs every 12 hours and on-demand when an open ticket disappears.
     */
    public function syncCompleted(): TicketSyncRun
    {
        $run = $this->syncRunRepository->start(TicketSyncRunKind::Completed);

        try {
            $records = $this->client->fetchCompleted();
            $fetched = count($records);
            $inserted = 0;
            $updated = 0;
            $skipped = 0;

            $technicianIds = User::query()
                ->whereNotNull('employee_id')
                ->where('is_active', true)
                ->where('employee_id', 'like', 'Z%')
                ->pluck('employee_id')
                ->flip();

            $trackedTicketNos = Ticket::query()->pluck('ticket_no')->flip();

            foreach ($records as $record) {
                $ticketNo = $record['ticket_no'] ?? '';

                if ($ticketNo === '') {
                    $skipped++;

                    continue;
                }

                $assignedId = $record['assigned_to_id'] ?? null;

                $relevant = ($assignedId !== null && $technicianIds->has($assignedId))
                    || $trackedTicketNos->has($ticketNo);

                if (! $relevant) {
                    $skipped++;

                    continue;
                }

                if ($this->ticketRepository->upsertCompleted($record, $run)) {
                    $inserted++;
                } else {
                    $updated++;
                }
            }

            // Bersihkan otomatis tiket-tiket NSS/huruf lama yang masih nyangkut, setelah API selesai
            $this->ticketRepository->sweepDisappearedStringTickets();

            return $this->syncRunRepository->finish(
                $run,
                TicketSyncRunStatus::Success,
                $fetched,
                $inserted,
                $updated,
                $skipped,
            );
        } catch (\Throwable $exception) {
            $this->syncRunRepository->finish(
                $run,
                TicketSyncRunStatus::Failed,
                0,
                0,
                0,
                0,
                $exception->getMessage(),
            );

            throw $exception;
        }
    }
}
