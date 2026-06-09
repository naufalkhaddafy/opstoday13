import { Head, router } from '@inertiajs/react';
import TicketController from '@/actions/App/Http/Controllers/TicketController';
import { TicketsHeader } from '@/components/admin/users/tickets/TicketsHeader';
import { TicketsSummaryCards } from '@/components/admin/users/tickets/TicketsSummaryCards';
import { TicketsFilters } from '@/components/admin/users/tickets/TicketsFilters';
import { TicketsTable } from '@/components/admin/users/tickets/TicketsTable';

type User = {
    id: number;
    name: string;
    email: string;
    employee_id: string | null;
};

type TicketItem = {
    id: number;
    ticket_no: string;
    title: string | null;
    category: string | null;
    sub_category: string | null;
    computer_name: string | null;
    requested_for: string | null;
    status: 'assigned' | 'pending_on_hold' | 'in_progress' | 'closed' | null;
    status_label: string | null;
    work_group: string | null;
    first_seen_at: string | null;
    in_progress_at: string | null;
    status_changed_at: string | null;
    disappeared_at: string | null;
    response_time_seconds: number | null;
    response_time_label: string | null;
    api_creation_date: string | null;
    completed_date: string | null;
    resolution_time: string | null;
};

type Summary = {
    total: number;
    open: number;
    in_progress: number;
    pending: number;
    closed: number;
    avg_response_time_seconds: number | null;
    avg_response_time_label: string | null;
    avg_resolution_time_hours: number | null;
    avg_resolution_time_label: string | null;
    resolved_count: number;
};

type StatusOption = {
    value: string;
    label: string;
};

type TicketsProps = {
    user: User;
    tickets: TicketItem[];
    summary: Summary;
    filters: {
        status: string | null;
        search: string | null;
        month: number | 'all';
        year: number;
    };
    status_options: StatusOption[];
};

export default function PersonalTickets({ user, tickets, summary, filters, status_options }: TicketsProps) {
    const navigate = (next: {
        status?: string | null;
        search?: string | null;
        month?: number | 'all';
        year?: number;
    }) => {
        const month = next.month !== undefined ? next.month : filters.month;
        const params: Record<string, string | number> = {
            month,
            year: next.year ?? filters.year,
        };

        const status = next.status !== undefined ? next.status : filters.status;
        if (status) {
            params.status = status;
        }

        const search = next.search !== undefined ? next.search : filters.search;
        if (search) {
            params.search = search;
        }

        router.get(TicketController.index().url, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    let exportUrl = `/tickets/export?month=${filters.month}&year=${filters.year}`;
    if (filters.status) exportUrl += `&status=${filters.status}`;
    if (filters.search) exportUrl += `&search=${filters.search}`;

    return (
        <>
            <Head title={`Data Tiket: ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
                <TicketsHeader user={user} hideBackButton={true} />

                <TicketsSummaryCards summary={summary} />

                <TicketsFilters 
                    filters={filters} 
                    status_options={status_options} 
                    navigate={navigate} 
                    exportUrl={exportUrl} 
                />

                <TicketsTable tickets={tickets} />
            </div>
        </>
    );
}

PersonalTickets.layout = {
    breadcrumbs: [
        {
            title: 'Ticket Overview',
            href: '#',
        },
    ],
};
