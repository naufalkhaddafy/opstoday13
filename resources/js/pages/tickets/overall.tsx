import { Head, router } from '@inertiajs/react';
import OverallTicketController from '@/actions/App/Http/Controllers/OverallTicketController';
import { OverallTicketsFilters } from '@/components/admin/users/tickets/OverallTicketsFilters';
import { OverallTicketsTable } from '@/components/admin/users/tickets/OverallTicketsTable';
import { Ticket, Activity, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type User = {
    id: number;
    name: string;
    email: string;
    employee_id: string | null;
};

type Option = {
    id: number;
    name: string;
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
    assigned_user: {
        name: string;
        company: string | null;
        group: string | null;
    } | null;
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

type PaginatedTickets = {
    data: TicketItem[];
    links: {
        first?: string | null;
        last?: string | null;
        prev?: string | null;
        next?: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        links?: { url: string | null; label: string; active: boolean }[];
        path?: string;
        per_page: number;
        to: number | null;
        total: number;
    };
};

type OverallTicketsProps = {
    user: User;
    tickets: PaginatedTickets;
    filters: {
        search: string | null;
        company_id: number | null;
        group_id: number | null;
        date_from: string | null;
        date_to: string | null;
        defaults?: {
            date_from: string;
            date_to: string;
        };
    };
    options: {
        companies: Option[];
        groups: Option[];
    };
    stats: {
        total: number;
        assigned: number;
        pending: number;
        in_progress: number;
        closed: number;
    };
};

export default function OverallTickets({ user, tickets, filters, options, stats }: OverallTicketsProps) {
    const navigate = (next: {
        search?: string | null;
        company_id?: number | null;
        group_id?: number | null;
        date_from?: string | null;
        date_to?: string | null;
    }) => {
        const params: Record<string, string | number> = {};

        const dateFrom = next.date_from !== undefined ? next.date_from : filters.date_from;
        if (dateFrom) params.date_from = dateFrom;

        const dateTo = next.date_to !== undefined ? next.date_to : filters.date_to;
        if (dateTo) params.date_to = dateTo;

        const search = next.search !== undefined ? next.search : filters.search;
        if (search) params.search = search;

        const companyId = next.company_id !== undefined ? next.company_id : filters.company_id;
        if (companyId) params.company_id = companyId;

        const groupId = next.group_id !== undefined ? next.group_id : filters.group_id;
        if (groupId) params.group_id = groupId;

        router.get(OverallTicketController.index().url, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Overall Ticket" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Overall Ticket</h1>
                        <p className="text-sm text-muted-foreground">
                            Manajemen dan pantauan seluruh tiket dalam sistem
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tiket</CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.assigned}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                            <Activity className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.in_progress}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending/On Hold</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Closed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.closed}</div>
                        </CardContent>
                    </Card>
                </div>

                <OverallTicketsFilters 
                    filters={filters} 
                    options={options}
                    navigate={navigate} 
                />

                <OverallTicketsTable tickets={tickets} />
            </div>
        </>
    );
}

OverallTickets.layout = {
    breadcrumbs: [
        {
            title: 'Overall Ticket',
            href: '#',
        },
    ],
};
