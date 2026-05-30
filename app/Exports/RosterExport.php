<?php

namespace App\Exports;

use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class RosterExport implements FromArray, WithHeadings, WithStyles, WithTitle, ShouldAutoSize
{
    protected int $month;
    protected int $year;
    protected array $filters;
    protected int $daysInMonth;
    protected array $monthDays = [];

    /** @var string[] */
    private const DAY_NAMES_SHORT = [
        1 => 'Sen', 2 => 'Sel', 3 => 'Rab', 4 => 'Kam',
        5 => 'Jum', 6 => 'Sab', 7 => 'Min',
    ];

    private const MONTH_NAMES = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
        4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September',
        10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    public function __construct(int $month, int $year, array $filters = [])
    {
        $this->month = $month;
        $this->year = $year;
        $this->filters = $filters;

        $timezone = config('app.timezone');
        $startOfMonth = CarbonImmutable::create($year, $month, 1, 0, 0, 0, $timezone);
        $this->daysInMonth = $startOfMonth->daysInMonth;

        for ($d = 1; $d <= $this->daysInMonth; $d++) {
            $dayDate = CarbonImmutable::create($year, $month, $d, 0, 0, 0, $timezone);
            $this->monthDays[] = [
                'date' => $dayDate->toDateString(),
                'day' => $d,
                'day_of_week_iso' => $dayDate->dayOfWeekIso,
            ];
        }
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        $headings = ['No', 'Nama Karyawan', 'ID Karyawan', 'Perusahaan'];

        foreach ($this->monthDays as $day) {
            $dayName = self::DAY_NAMES_SHORT[$day['day_of_week_iso']] ?? '';
            $headings[] = $day['day'] . "\n" . $dayName;
        }

        return $headings;
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    public function array(): array
    {
        $userRepo = app(UserRepositoryInterface::class);
        $shiftResolver = app(ShiftAssignmentResolver::class);
        $timezone = config('app.timezone');

        $employees = $userRepo->getEmployeesForRoster($this->filters);

        $rows = [];
        $no = 1;

        foreach ($employees as $user) {
            $row = [
                $no++,
                $user->name,
                $user->employee_id ?? '-',
                $user->company?->name ?? '-',
            ];

            foreach ($this->monthDays as $day) {
                $workDate = CarbonImmutable::parse($day['date'], $timezone);
                $shift = $shiftResolver->shiftForWorkDate($user, $workDate);
                $row[] = $shift ? strtoupper($shift->code) : 'L';
            }

            $rows[] = $row;
        }

        return $rows;
    }

    public function title(): string
    {
        $monthName = self::MONTH_NAMES[$this->month] ?? '';
        return "Roster {$monthName} {$this->year}";
    }

    public function styles(Worksheet $sheet): array
    {
        $lastCol = $this->getColumnLetter(4 + $this->daysInMonth);
        $lastRow = $sheet->getHighestRow();

        // Header row styling
        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F46E5'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
        ]);

        // All cells border
        $sheet->getStyle("A1:{$lastCol}{$lastRow}")->applyFromArray([
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

        // Center shift cells (column E onward)
        $colE = $this->getColumnLetter(5);
        $sheet->getStyle("{$colE}2:{$lastCol}{$lastRow}")->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'font' => ['size' => 9],
        ]);

        // Set fixed width for day columns
        for ($i = 5; $i <= 4 + $this->daysInMonth; $i++) {
            $colLetter = $this->getColumnLetter($i);
            $sheet->getColumnDimension($colLetter)->setWidth(6);
        }

        // Freeze first row + first 4 columns
        $sheet->freezePane('E2');

        // Set row height for header
        $sheet->getRowDimension(1)->setRowHeight(35);

        // Weekend column coloring
        foreach ($this->monthDays as $index => $day) {
            if ($day['day_of_week_iso'] >= 6) {
                $colLetter = $this->getColumnLetter(5 + $index);
                $sheet->getStyle("{$colLetter}1:{$colLetter}{$lastRow}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => $day['day_of_week_iso'] === 7 ? 'FEE2E2' : 'FEF3C7'],
                    ],
                ]);
                // Re-apply header color for weekend columns
                $sheet->getStyle("{$colLetter}1")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => $day['day_of_week_iso'] === 7 ? 'DC2626' : 'D97706'],
                    ],
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                ]);
            }
        }

        return [];
    }

    /**
     * Convert column number (1-based) to Excel column letter.
     */
    private function getColumnLetter(int $colNumber): string
    {
        $letter = '';
        while ($colNumber > 0) {
            $colNumber--;
            $letter = chr(65 + ($colNumber % 26)) . $letter;
            $colNumber = intdiv($colNumber, 26);
        }
        return $letter;
    }
}
