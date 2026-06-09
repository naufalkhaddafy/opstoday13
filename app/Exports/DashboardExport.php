<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class DashboardExport implements WithMultipleSheets
{
    use Exportable;

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

    public function sheets(): array
    {
        return [
            new Sheets\TicketsSheet($this->dateFrom, $this->dateTo, $this->companyId, $this->search, $this->status),
            new Sheets\AttendanceSheet($this->dateFrom, $this->dateTo, $this->companyId),
        ];
    }
}
