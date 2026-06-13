<?php

namespace App\Repositories\Eloquent;

use App\Models\Ticket;
use App\Repositories\Contracts\TicketQueryRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class TicketQueryRepository implements TicketQueryRepositoryInterface
{
    private function getOverallBaseQuery(array $filters): Builder
    {
        $query = Ticket::query()
            ->with(['assignedUser.company', 'assignedUser.group'])
            ->whereNull('disappeared_at');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('ticket_no', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhereHas('assignedUser', function (Builder $q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('aiPrediction', function (Builder $q3) use ($search) {
                      $q3->where('cluster_label', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['company_id'])) {
            $query->whereHas('assignedUser', function (Builder $q) use ($filters) {
                $q->where('company_id', $filters['company_id']);
            });
        }

        if (!empty($filters['group_id'])) {
            $query->whereHas('assignedUser', function (Builder $q) use ($filters) {
                $q->where('group_id', $filters['group_id']);
            });
        }

        if (!empty($filters['date_from']) && !empty($filters['date_to'])) {
            $dateExpression = 'COALESCE(api_creation_date, first_seen_at, status_changed_at)';
            $query->whereRaw("DATE({$dateExpression}) BETWEEN ? AND ?", [
                $filters['date_from'],
                $filters['date_to']
            ]);
        }

        return $query;
    }

    public function getOverallTickets(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->getOverallBaseQuery($filters);

        // Sort by status closed -> bottom, then by created desc
        $query->orderByRaw("CASE WHEN status = 'closed' THEN 1 ELSE 0 END")
              ->orderByRaw('COALESCE(completed_date, status_changed_at) DESC')
              ->orderByDesc('status_changed_at');

        return $query->paginate($perPage)->withQueryString();
    }

    public function getOverallTicketsStats(array $filters): array
    {
        $query = $this->getOverallBaseQuery($filters);
        
        $stats = $query->toBase()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        $assigned = $stats['assigned'] ?? 0;
        $pending = $stats['pending_on_hold'] ?? 0;
        $inProgress = $stats['in_progress'] ?? 0;
        $closed = $stats['closed'] ?? 0;
        
        // Summing all statuses for total
        $total = array_sum($stats);

        return [
            'total' => $total,
            'assigned' => $assigned,
            'pending' => $pending,
            'in_progress' => $inProgress,
            'closed' => $closed,
        ];
    }
}
