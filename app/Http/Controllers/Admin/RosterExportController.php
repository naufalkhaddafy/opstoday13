<?php

namespace App\Http\Controllers\Admin;

use App\Exports\RosterExport;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Group;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RosterExportController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse
    {
        $timezone = config('app.timezone');
        $now = CarbonImmutable::now($timezone);

        $month = max(1, min(12, (int) $request->input('month', $now->month)));
        $year = max(2020, min(2099, (int) $request->input('year', $now->year)));

        $filters = [
            'search' => $request->input('search'),
            'company_id' => $request->input('company_id', 'all'),
            'group_id' => $request->input('group_id', 'all'),
        ];

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
            4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September',
            10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $companyName = 'All Companies';
        if ($filters['company_id'] !== 'all') {
            $company = Company::find($filters['company_id']);
            if ($company) {
                $companyName = $company->name;
            }
        }

        $groupName = 'All Groups';
        if ($filters['group_id'] !== 'all') {
            $group = Group::find($filters['group_id']);
            if ($group) {
                $groupName = $group->name;
            }
        }

        $filename = 'Roster_' . ($monthNames[$month] ?? $month) . "_{$year}.xlsx";

        return Excel::download(new RosterExport($month, $year, $filters, $companyName, $groupName), $filename);
    }
}
