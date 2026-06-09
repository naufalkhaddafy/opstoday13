<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class UserAttendanceExport implements FromArray, WithTitle, WithHeadings, WithStyles
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
        return [
            'Tanggal',
            'Jadwal Shift',
            'Jam Masuk',
            'Jam Pulang',
            'Status',
            'Keterlambatan (Menit)',
            'Pulang Cepat (Menit)',
            'Lembur (Menit)',
        ];
    }

    public function title(): string
    {
        return 'Attendance ' . $this->monthName . ' ' . $this->year;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
