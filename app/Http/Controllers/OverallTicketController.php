<?php

namespace App\Http\Controllers;

use App\Http\Resources\Admin\OverallTicketsPageResource;
use App\Models\Company;
use App\Models\Group;
use App\Models\User;
use App\Repositories\Contracts\TicketQueryRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class OverallTicketController extends Controller
{
    public function __construct(
        private readonly TicketQueryRepositoryInterface $ticketQuery
    ) {}

    /**
     * Tampilkan halaman Overall Ticket.
     */
    public function index(Request $request): Response
    {
        $timezone = config('app.timezone');
        $user = Auth::user();

        $filters = [
            'search' => trim((string) $request->input('search', '')),
            'company_id' => $request->input('company_id'),
            'group_id' => $request->input('group_id'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'defaults' => [
                'date_from' => now($timezone)->startOfMonth()->format('Y-m-d'),
                'date_to' => now($timezone)->endOfMonth()->format('Y-m-d'),
            ],
        ];

        // Ensure empty string becomes null for backend logic
        $filters = array_map(fn($val) => $val === '' ? null : $val, $filters);

        $queryFilters = $filters;

        // Apply defaults if date_from or date_to is null
        if (empty($queryFilters['date_from'])) {
            $queryFilters['date_from'] = $queryFilters['defaults']['date_from'];
        }
        if (empty($queryFilters['date_to'])) {
            $queryFilters['date_to'] = $queryFilters['defaults']['date_to'];
        }

        $tickets = $this->ticketQuery->getOverallTickets($queryFilters, 15);
        $stats = $this->ticketQuery->getOverallTicketsStats($queryFilters);

        // Fetch options for dropdowns
        $companies = Company::select('id', 'name')->orderBy('name')->get();
        $groups = Group::select('id', 'name')->orderBy('name')->get();

        return Inertia::render(
            'tickets/overall',
            OverallTicketsPageResource::make([
                'user' => $user,
                'tickets' => $tickets,
                'stats' => $stats,
                'filters' => $filters,
                'options' => [
                    'companies' => $companies,
                    'groups' => $groups,
                ],
            ])->resolve($request)
        );
    }
}
