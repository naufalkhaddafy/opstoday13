<?php

use App\Enums\TicketStatus;
use App\Exports\Sheets\TicketsSheet;
use App\Models\Ticket;
use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Excel;
use Maatwebsite\Excel\Facades\Excel as ExcelFacade;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Border;

it('writes ticket rows directly while retaining export data and styles', function () {
    $ticket = new Ticket([
        'ticket_no' => '12345', 'status' => TicketStatus::Closed, 'requested_for' => '=1+1',
        'assigned_to_name' => 'Fallback Name', 'api_creation_date' => '2026-10-01',
        'completed_date' => '2026-10-02', 'response_time_seconds' => 3660, 'resolution_time' => '2.5',
    ]);
    $ticket->setRelation('assignedUser', null);
    $nonStandard = clone $ticket;
    $nonStandard->ticket_no = 'NSS123';
    $rows = array_fill(0, 1001, $ticket);
    $rows[] = $nonStandard;

    $repo = Mockery::mock(TicketDashboardRepositoryInterface::class);
    $repo->shouldReceive('paginateLatest')->once()->andReturn(new LengthAwarePaginator($rows, count($rows), 100000));
    $repo->shouldReceive('globalStats')->once()->andReturn(['created_today' => count($rows)]);
    $repo->shouldReceive('engineerSummaries')->once()->andReturn(collect());
    app()->instance(TicketDashboardRepositoryInterface::class, $repo);

    $export = new TicketsSheet(CarbonImmutable::parse('2026-10-01'), CarbonImmutable::parse('2026-10-31'), null, null, null);
    $path = tempnam(sys_get_temp_dir(), 'dashboard-export-');
    try {
        file_put_contents($path, ExcelFacade::raw($export, Excel::XLSX));
        $book = IOFactory::load($path);
        $sheet = $book->getActiveSheet();
        $first = null;
        foreach ($sheet->getColumnIterator('A') as $column) {
            foreach ($column->getCellIterator() as $cell) {
                if ($cell->getValue() === 'Ticket No') {
                    $first = $cell->getRow() + 1;
                }
            }
        }
        expect($first)->not->toBeNull();
        expect($sheet->getHighestRow() - $first + 1)->toBe(1002);
        expect($sheet->getCell('A'.$first)->getValue())->toBe(12345);
        expect($sheet->getCell('B'.$first)->getValue())->toBe(TicketStatus::Closed->value);
        expect($sheet->getCell('C'.$first)->getValue())->toBe('=1+1');
        expect($sheet->getCell('C'.$first)->getDataType())->toBe(DataType::TYPE_STRING);
        expect($sheet->getCell('D'.$first)->getValue())->toBe('Fallback Name');
        expect($sheet->getCell('E'.$first)->getValue())->toBe('2026-10-01');
        expect($sheet->getCell('G'.$first)->getValue())->toBe('1h 1m');
        expect($sheet->getCell('H'.$first)->getValue())->toBe('2h 30m');
        $last = $sheet->getHighestRow();
        expect($sheet->getCell('A'.$last)->getValue())->toBe('NSS123');
        expect($sheet->getCell('G'.$last)->getValue())->toBe('-');
        expect($sheet->getStyle('A'.$first)->getBorders()->getBottom()->getBorderStyle())->toBe(Border::BORDER_THIN);
        expect($sheet->getStyle('H'.$last)->getBorders()->getRight()->getBorderStyle())->toBe(Border::BORDER_THIN);
        expect($sheet->getColumnDimension('C')->getAutoSize())->toBeFalse();
        expect($sheet->getColumnDimension('C')->getWidth())->toBe(32.0);
        $book->disconnectWorksheets();
    } finally {
        unlink($path);
    }
});

it('exports the ticket header when there are no matching tickets', function () {
    $repo = Mockery::mock(TicketDashboardRepositoryInterface::class);
    $repo->shouldReceive('paginateLatest')->andReturn(new LengthAwarePaginator([], 0, 100000));
    $repo->shouldReceive('globalStats')->andReturn([]);
    $repo->shouldReceive('engineerSummaries')->andReturn(collect());
    app()->instance(TicketDashboardRepositoryInterface::class, $repo);
    $export = new TicketsSheet(CarbonImmutable::parse('2026-10-01'), CarbonImmutable::parse('2026-10-31'), null, null, null);
    expect(ExcelFacade::raw($export, Excel::XLSX))->toStartWith('PK');
});
