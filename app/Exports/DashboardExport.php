<?php

namespace App\Exports;

use App\Models\Company;
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
        $companyName = null;
        if ($this->companyId) {
            $companyName = Company::find($this->companyId)?->name;
        }

        return [
            new Sheets\TicketsSheet($this->dateFrom, $this->dateTo, $this->companyId, $this->search, $this->status, $companyName),
            new Sheets\AttendanceSheet($this->dateFrom, $this->dateTo, $this->companyId, $companyName),
            new Sheets\TopIssuesSheet($this->dateFrom, $this->dateTo, $this->companyId, $companyName),
        ];
    }
}
