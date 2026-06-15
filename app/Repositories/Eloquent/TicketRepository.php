<?php

namespace App\Repositories\Eloquent;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\TicketAssignmentHistory;
use App\Models\TicketSyncRun;
use App\Models\User;
use App\Repositories\Contracts\TicketRepositoryInterface;
use App\Services\Analytics\AIEngineService;
use Carbon\CarbonInterface;

class TicketRepository implements TicketRepositoryInterface
{
    /**
     * In-request cache of employee_id => user_id (null = no match).
     *
     * @var array<string, int|null>
     */
    protected array $userIdCache = [];

    public function __construct(
        protected AIEngineService $aiEngine
    ) {}

    public function upsertOpen(array $record, string $polledTechnicianId, TicketSyncRun $run): bool
    {
        $now = now();
        $ticket = Ticket::query()->where('ticket_no', $record['ticket_no'])->first();
        $isNew = $ticket === null;
        $oldTitle = $ticket ? $ticket->title : null;

        if ($ticket === null) {
            $ticket = new Ticket();
            $ticket->ticket_no = $record['ticket_no'];
        }

        $this->applyDescriptiveFields($ticket, $record);

        $incomingStatus = $record['status'] instanceof TicketStatus
            ? $record['status']
            : TicketStatus::Assigned;

        if ($isNew) {
            $ticket->status = $incomingStatus;
            $ticket->assigned_to_id = $polledTechnicianId;
            $ticket->assigned_to_name = $record['assigned_to_name'] ?? null;
            $ticket->assigned_to_user_id = $this->resolveUserId($polledTechnicianId);
            $ticket->first_seen_at = $now;
            $ticket->status_changed_at = $now;
            $ticket->in_progress_at = null;
            $ticket->response_time_seconds = null;
            $ticket->disappeared_at = null;
        } elseif ($ticket->assigned_to_id !== $polledTechnicianId) {
            // Ticket handed over to another technician: record history and reset.
            TicketAssignmentHistory::query()->create([
                'ticket_id' => $ticket->id,
                'from_assigned_to_id' => $ticket->assigned_to_id,
                'to_assigned_to_id' => $polledTechnicianId,
                'changed_at' => $now,
                'sync_run_id' => $run->id,
            ]);

            $ticket->assigned_to_id = $polledTechnicianId;
            $ticket->assigned_to_name = $record['assigned_to_name'] ?? null;
            $ticket->assigned_to_user_id = $this->resolveUserId($polledTechnicianId);
            $ticket->status = TicketStatus::Assigned;
            $ticket->first_seen_at = $now;
            $ticket->status_changed_at = $now;
            $ticket->in_progress_at = null;
            $ticket->response_time_seconds = null;
            $ticket->disappeared_at = null;
        } else {
            // Same technician: detect status change and refresh assignee label.
            $ticket->assigned_to_name = $record['assigned_to_name'] ?? $ticket->assigned_to_name;

            if ($ticket->status !== $incomingStatus) {
                $ticket->status = $incomingStatus;
                $ticket->status_changed_at = $now;
            }

            // Ticket reappeared in the open list, so it is not gone.
            $ticket->disappeared_at = null;
        }

        // Capture first transition into "In Progress" once.
        if ($ticket->status === TicketStatus::InProgress && $ticket->in_progress_at === null) {
            $ticket->in_progress_at = $now;
            $ticket->response_time_seconds = $this->secondsBetween($ticket->first_seen_at, $now);
        }

        $ticket->last_synced_at = $now;
        $ticket->sync_batch_id = $run->id;
        $ticket->save();

        $this->processAIPrediction($ticket, $oldTitle);

        return $isNew;
    }

    public function upsertCompleted(array $record, TicketSyncRun $run): bool
    {
        $now = now();
        $ticket = Ticket::query()->where('ticket_no', $record['ticket_no'])->first();
        $isNew = $ticket === null;
        $oldTitle = $ticket ? $ticket->title : null;

        if ($ticket === null) {
            $ticket = new Ticket();
            $ticket->ticket_no = $record['ticket_no'];
        }

        $this->applyDescriptiveFields($ticket, $record);

        if ($ticket->status !== TicketStatus::Closed) {
            $ticket->status = TicketStatus::Closed;
            $ticket->status_changed_at = $now;
        }

        if (! empty($record['assigned_to_id'])) {
            $ticket->assigned_to_id = $record['assigned_to_id'];
            $ticket->assigned_to_user_id = $this->resolveUserId($record['assigned_to_id']);
        }

        $ticket->assigned_to_name = $record['assigned_to_name'] ?? $ticket->assigned_to_name;
        $ticket->work_group = $record['work_group'] ?? $ticket->work_group;
        $ticket->api_creation_date = $record['api_creation_date'] ?? $ticket->api_creation_date;
        $ticket->completed_date = $record['completed_date'] ?? $ticket->completed_date;
        $ticket->resolution_time = $record['resolution_time'] ?? $ticket->resolution_time;
        $ticket->disappeared_at = null;
        $ticket->last_synced_at = $now;
        $ticket->sync_batch_id = $run->id;

        // For historical backfill (never tracked while open), response time is ignored:
        // first_seen_at / in_progress_at / response_time_seconds stay null.
        $ticket->save();

        $this->processAIPrediction($ticket, $oldTitle);

        return $isNew;
    }

    public function markDisappeared(array $seenTicketNos): int
    {
        $query = Ticket::query()
            ->where('status', '!=', TicketStatus::Closed->value)
            ->whereNull('disappeared_at');

        if ($seenTicketNos !== []) {
            $query->whereNotIn('ticket_no', $seenTicketNos);
        }

        return $query->update(['disappeared_at' => now()]);
    }

    /**
     * @param  array<string, mixed>  $record
     */
    protected function applyDescriptiveFields(Ticket $ticket, array $record): void
    {
        $ticket->category = $record['category'] ?? $ticket->category;
        $ticket->sub_category = $record['sub_category'] ?? $ticket->sub_category;
        $ticket->title = $record['title'] ?? $ticket->title;
        $ticket->computer_name = $record['computer_name'] ?? $ticket->computer_name;
        $ticket->requested_for = $record['requested_for'] ?? $ticket->requested_for;
        $ticket->requested_by = $record['requested_by'] ?? $ticket->requested_by;

        if (! empty($record['work_group'])) {
            $ticket->work_group = $record['work_group'];
        }
    }

    protected function processAIPrediction(Ticket $ticket, ?string $oldTitle): void
    {
        if (!$ticket->title) {
            return;
        }

        $needsPrediction = $oldTitle !== $ticket->title || !$ticket->aiPrediction()->exists();

        if ($needsPrediction) {
            $aiResult = $this->aiEngine->analyzeTicket($ticket->title, '');
            if ($aiResult) {
                $ticket->aiPrediction()->updateOrCreate(
                    ['ticket_id' => $ticket->id],
                    [
                        'cluster_id' => $aiResult['cluster_id'] ?? null,
                        'cluster_label' => $aiResult['cluster_label'] ?? null,
                        'sub_cluster_label' => $aiResult['sub_cluster_label'] ?? null,
                        'suggested_solution' => $aiResult['suggested_solution'] ?? null,
                    ]
                );
            }
        }
    }

    protected function resolveUserId(?string $employeeId): ?int
    {
        if ($employeeId === null || $employeeId === '') {
            return null;
        }

        if (array_key_exists($employeeId, $this->userIdCache)) {
            return $this->userIdCache[$employeeId];
        }

        $userId = User::query()->where('employee_id', $employeeId)->value('id');

        return $this->userIdCache[$employeeId] = $userId === null ? null : (int) $userId;
    }

    protected function secondsBetween(?CarbonInterface $from, CarbonInterface $to): int
    {
        if ($from === null) {
            return 0;
        }

        return max(0, $from->diffInSeconds($to, true));
    }
}
