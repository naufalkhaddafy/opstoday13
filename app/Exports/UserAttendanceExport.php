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

class UserAttendanceExport implements FromArray, WithTitle, WithHeadings, WithStyles, ShouldAutoSize
{
    private array $logs;
    private string $userName;
    private string $monthName;
    private int $year;

    public function __construct(array $logs, string $userName, string $monthName, int $year)
    {
        $this->logs = $logs;
        $this->userName = $userName;
        $this->monthName = $monthName;
        $this->year = $year;
    }

    public function array(): array
    {
        $rows = [];
        
        $statusLabels = [
            'hadir' => 'Hadir',
            'tidak_lengkap' => 'Incomplete',
            'absen' => 'Absen / Mangkir',
            'tidak_hadir' => 'Tidak Hadir',
            'scheduled' => 'Belum Absen',
            'off_day' => 'Hari Libur',
            'cuti' => 'Cuti',
            'sakit' => 'Sakit',
            'izin' => 'Izin',
        ];

        foreach ($this->logs as $log) {
            $shiftLabel = $log['shift'] ? $log['shift']['name'] . ' (' . $log['shift']['start_time'] . ' - ' . $log['shift']['end_time'] . ')' : '-';
            
            $status = $statusLabels[$log['presence_status']] ?? ucfirst($log['presence_status']);

            $rows[] = [
                $log['date'],
                $shiftLabel,
                $log['check_in_at'] ? date('H:i', strtotime($log['check_in_at'])) : '-',
                $log['check_out_at'] ? date('H:i', strtotime($log['check_out_at'])) : '-',
                $status,
                $log['late_minutes'] > 0 ? $log['late_minutes'] : '-',
                $log['early_leave_minutes'] > 0 ? $log['early_leave_minutes'] : '-',
                $log['overtime_minutes'] > 0 ? $log['overtime_minutes'] : '-',
            ];
        }

        return $rows;
    }

    public function headings(): array
    {
        $exportDate = \Carbon\CarbonImmutable::now(config('app.timezone'))->format('d M Y H:i:s');
        
        $titleRow1 = ["Laporan Kehadiran Karyawan - {$this->monthName} {$this->year}"];
        $titleRow2 = ["Nama Karyawan: {$this->userName}"];
        $titleRow3 = ["Tanggal Export: {$exportDate}"];
        $titleRow4 = [];

        $headings = [
            'Tanggal',
            'Jadwal Shift',
            'Jam Masuk',
            'Jam Pulang',
            'Status',
            'Keterlambatan (Menit)',
            'Pulang Cepat (Menit)',
            'Lembur (Menit)',
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
        return 'Attendance ' . $this->monthName . ' ' . $this->year;
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $sheet->getHighestRow();

        // Title Row Styling
        $sheet->getStyle("A1:H1")->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->mergeCells("A1:H1");

        $sheet->getStyle("A2:H2")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->mergeCells("A2:H2");

        $sheet->getStyle("A3:H3")->applyFromArray([
            'font' => ['italic' => true, 'size' => 11],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->mergeCells("A3:H3");

        // Header row styling (Now Row 5)
        $sheet->getStyle("A5:H5")->applyFromArray([
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
            $sheet->getStyle("A5:H{$lastRow}")->applyFromArray([
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
            
            // Center align everything except column B (Jadwal Shift)
            $sheet->getStyle("A6:A{$lastRow}")->applyFromArray(['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]]);
            $sheet->getStyle("C6:H{$lastRow}")->applyFromArray(['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]]);
        }

        // Freeze first 5 rows
        $sheet->freezePane('A6');

        // Set row height for header
        $sheet->getRowDimension(5)->setRowHeight(25);

        return [];
    }
}
