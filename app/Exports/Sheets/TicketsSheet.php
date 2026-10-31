<?php

namespace App\Exports\Sheets;

use App\Exports\Support\TicketExportRow;
use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TicketsSheet extends DefaultValueBinder implements FromView, WithColumnWidths, WithCustomValueBinder, WithStyles, WithTitle
{
    private array $tickets = [];

    private $dateFrom;

    private $dateTo;

    private $companyId;

    private $search;

    private $status;

    private $companyName;

    public function __construct($dateFrom, $dateTo, $companyId, $search, $status, $companyName = null, private array $workGroups = [], private ?string $sortBy = null, private string $sortDir = 'desc')
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->companyId = $companyId;
        $this->search = $search;
        $this->status = $status;
        $this->companyName = $companyName;
    }

    public function view(): View
    {
        $repo = app(TicketDashboardRepositoryInterface::class);

        $paginator = $repo->paginateLatest(
            $this->dateFrom,
            $this->dateTo,
            $this->companyId,
            100000,
            $this->search,
            $this->sortBy,
            $this->sortDir,
            $this->status,
            $this->workGroups
        );

        $stats = $repo->globalStats(
            $this->dateFrom,
            $this->dateTo,
            $this->companyId,
            $this->workGroups,
            $this->search,
            $this->status
        );

        $engineers = $repo->engineerSummaries(
            $this->dateFrom,
            $this->dateTo,
            $this->companyId,
            $this->workGroups,
            $this->search,
            $this->status
        );

        $this->tickets = $paginator->items();

        return view('exports.public_dashboard.tickets_overview', [
            'stats' => $stats,
            'engineers' => $engineers,
            'dateFrom' => $this->dateFrom,
            'dateTo' => $this->dateTo,
            'companyName' => $this->companyName,
            'selectedWorkGroups' => $this->workGroups,
        ]);
    }

    public function title(): string
    {
        return 'Ticket Overview';
    }

    public function columnWidths(): array
    {
        return ['A' => 24, 'B' => 22, 'C' => 32, 'D' => 32, 'E' => 20, 'F' => 20, 'G' => 24, 'H' => 26];
    }

    public function bindValue(Cell $cell, $value): bool
    {
        if (is_string($value) && str_starts_with($value, '=')) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);

            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function styles(Worksheet $sheet): void
    {
        if ($this->tickets === []) {
            return;
        }

        $firstRow = $sheet->getHighestRow() + 1;
        $row = $firstRow;
        foreach (array_chunk($this->tickets, 1000) as $chunk) {
            $sheet->fromArray(array_map(TicketExportRow::map(...), $chunk), null, 'A'.$row, true);
            $row += count($chunk);
        }

        $lastRow = $row - 1;
        $sheet->getStyle("A{$firstRow}:H{$lastRow}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D1D5DB']]],
        ], false);
        $sheet->getStyle("G{$firstRow}:H{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
    }
}
