<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class UserTicketsExport implements FromArray, WithTitle, WithHeadings, WithStyles
{
    private array $tickets;
    private string $userName;
    private string $monthName;
    private int $year;

    public function __construct(array $tickets, string $userName, string $monthName, int $year)
    {
        $this->tickets = $tickets;
        $this->userName = $userName;
        $this->monthName = $monthName;
        $this->year = $year;
    }

    public function array(): array
    {
        $rows = [];
        
        foreach ($this->tickets as $ticket) {
            $createdDate = $ticket['api_creation_date'] 
                ? date('d M Y', strtotime($ticket['api_creation_date'])) 
                : ($ticket['first_seen_at'] ? date('d M Y H:i', strtotime($ticket['first_seen_at'])) : '-');
            
            $completedDate = $ticket['completed_date'] 
                ? date('d M Y', strtotime($ticket['completed_date'])) 
                : '-';

            $rows[] = [
                $ticket['ticket_no'],
                $ticket['title'] ?? '-',
                $ticket['category'] ?? '-',
                $ticket['sub_category'] ?? '-',
                $ticket['status_label'] ?? '-',
                $createdDate,
                $ticket['response_time_label'] ?? '-',
                $completedDate,
                $ticket['resolution_time'] ? round($ticket['resolution_time'], 2) . ' Jam' : '-',
            ];
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'No Tiket',
            'Judul',
            'Kategori',
            'Sub Kategori',
            'Status',
            'Created Date',
            'Response Time',
            'Completion Date',
            'Resolution Time (Jam)',
        ];
    }

    public function title(): string
    {
        $title = 'Tickets';
        if ($this->monthName !== 'Semua Bulan') {
            $title .= ' ' . substr($this->monthName, 0, 3);
        }
        $title .= ' ' . $this->year;
        return $title;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
