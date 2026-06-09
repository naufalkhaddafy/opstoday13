<?php

namespace App\Exports\Sheets;

use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMapping;

class TicketsSheet implements FromCollection, WithTitle, WithHeadings, WithMapping
{
    private $dateFrom;
    private $dateTo;
    private $companyId;
    private $search;
    private $status;

    public function __construct($dateFrom, $dateTo, $companyId, $search, $status)
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->companyId = $companyId;
        $this->search = $search;
        $this->status = $status;
    }

    public function collection()
    {
        $repo = app(TicketDashboardRepositoryInterface::class);
        $paginator = $repo->paginateLatest(
            $this->dateFrom,
            $this->dateTo,
            $this->companyId,
            100000,
            $this->search,
            null,
            'desc',
            $this->status
        );
        return collect($paginator->items());
    }

    public function headings(): array
    {
        return [
            'Ticket No',
            'Status',
            'Summary',
            'Description',
            'Computer Name',
            'Requested For',
            'Assigned To',
            'Created Date',
            'First Response Time (Sec)',
            'Resolution Time (Hrs)',
        ];
    }

    public function map($ticket): array
    {
        return [
            $ticket->ticket_no,
            $ticket->status?->value ?? (is_string($ticket->status) ? $ticket->status : (string) $ticket->status),
            $ticket->summary,
            $ticket->description,
            $ticket->computer_name,
            $ticket->requested_for_name,
            $ticket->assignedUser ? $ticket->assignedUser->name : $ticket->assigned_to_name,
            $ticket->api_creation_date,
            $ticket->response_time_seconds,
            $ticket->resolution_time,
        ];
    }

    public function title(): string
    {
        return 'Tickets';
    }
}
