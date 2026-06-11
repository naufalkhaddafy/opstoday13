<?php

namespace App\Http\Controllers;

use App\Http\Resources\Admin\UserTicketsPageResource;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UserTicketsExport;

class TicketController extends Controller
{
    /**
     * Tampilkan report tiket IT yang ditangani user terpilih (personal).
     */
    public function index(Request $request): Response
    {
        $timezone = config('app.timezone');
        $user = Auth::user();

        $status = $request->input('status');
        $search = trim((string) $request->input('search', ''));
        $year = (int) $request->input('year', now($timezone)->year);

        $monthInput = $request->input('month', now($timezone)->month);
        $showAllMonths = $monthInput === 'all';
        $month = $showAllMonths ? null : (int) $monthInput;

        $dateExpression = 'COALESCE(api_creation_date, first_seen_at, status_changed_at)';

        $tickets = Ticket::query()
            ->whereNull('disappeared_at')
            ->where('assigned_to_user_id', $user->id)
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('ticket_no', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                });
            })
            ->when(! $showAllMonths, function ($query) use ($dateExpression, $month, $year) {
                $query->whereRaw("MONTH({$dateExpression}) = ?", [$month])
                    ->whereRaw("YEAR({$dateExpression}) = ?", [$year]);
            })
            ->orderByRaw("CASE WHEN status = 'closed' THEN 1 ELSE 0 END")
            ->orderByRaw('COALESCE(completed_date, status_changed_at) DESC')
            ->orderByDesc('status_changed_at')
            ->get();

        return Inertia::render(
            'tickets/index',
            UserTicketsPageResource::make([
                'user' => $user,
                'tickets' => $tickets,
                'status' => $status,
                'search' => $search !== '' ? $search : null,
                'month' => $showAllMonths ? 'all' : $month,
                'year' => $year,
            ])->resolve($request)
        );
    }

    /**
     * Export report tiket IT yang ditangani user terpilih ke Excel (personal).
     */
    public function export(Request $request)
    {
        $timezone = config('app.timezone');
        $user = Auth::user();

        $status = $request->input('status');
        $search = trim((string) $request->input('search', ''));
        $year = (int) $request->input('year', now($timezone)->year);

        $monthInput = $request->input('month', now($timezone)->month);
        $showAllMonths = $monthInput === 'all';
        $month = $showAllMonths ? null : (int) $monthInput;

        $dateExpression = 'COALESCE(api_creation_date, first_seen_at, status_changed_at)';

        $tickets = Ticket::query()
            ->whereNull('disappeared_at')
            ->where('assigned_to_user_id', $user->id)
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('ticket_no', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                });
            })
            ->when(! $showAllMonths, function ($query) use ($dateExpression, $month, $year) {
                $query->whereRaw("MONTH({$dateExpression}) = ?", [$month])
                    ->whereRaw("YEAR({$dateExpression}) = ?", [$year]);
            })
            ->orderByRaw("CASE WHEN status = 'closed' THEN 1 ELSE 0 END")
            ->orderByRaw('COALESCE(completed_date, status_changed_at) DESC')
            ->orderByDesc('status_changed_at')
            ->get();

        $resource = UserTicketsPageResource::make([
            'user' => $user,
            'tickets' => $tickets,
            'status' => $status,
            'search' => $search !== '' ? $search : null,
            'month' => $showAllMonths ? 'all' : $month,
            'year' => $year,
        ])->resolve($request);

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $monthName = $showAllMonths ? 'Semua Bulan' : ($monthNames[$month] ?? '');

        $fileName = "My_Tickets_{$monthName}_{$year}.xlsx";

        return Excel::download(new UserTicketsExport($resource['tickets'], $user->name, $monthName, $year), $fileName);
    }
}
