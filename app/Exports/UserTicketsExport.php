<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class UserTicketsExport implements FromArray, WithTitle, WithHeadings, WithStyles, ShouldAutoSize
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
        $exportDate = \Carbon\CarbonImmutable::now(config('app.timezone'))->format('d M Y H:i:s');
        
        $titleRow1 = ["Laporan Tiket Karyawan - {$this->monthName} {$this->year}"];
        $titleRow2 = ["Nama Karyawan: {$this->userName}"];
        $titleRow3 = ["Tanggal Export: {$exportDate}"];
        $titleRow4 = [];

        $headings = [
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

        return [
            $titleRow1,
            $titleRow2,
            $titleRow3,
            $titleRow4,
            $headings,
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
        $lastRow = $sheet->getHighestRow();

        // Title Row Styling
        $sheet->getStyle("A1:I1")->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->mergeCells("A1:I1");

        $sheet->getStyle("A2:I2")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->mergeCells("A2:I2");

        $sheet->getStyle("A3:I3")->applyFromArray([
            'font' => ['italic' => true, 'size' => 11],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->mergeCells("A3:I3");

        // Header row styling (Now Row 5)
        $sheet->getStyle("A5:I5")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F46E5'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // All cells border (Row 5 downwards)
        if ($lastRow >= 5) {
            $sheet->getStyle("A5:I{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'D1D5DB'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);
            
            // Center align everything except column B, C, D (Judul, Kategori, Sub Kategori)
            $sheet->getStyle("A6:A{$lastRow}")->applyFromArray(['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]]);
            $sheet->getStyle("E6:I{$lastRow}")->applyFromArray(['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]]);
        }

        // Freeze first 5 rows
        $sheet->freezePane('A6');

        // Set row height for header
        $sheet->getRowDimension(5)->setRowHeight(25);

        return [];
    }
}
