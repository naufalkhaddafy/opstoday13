import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TicketStatusBadge } from '@/components/shared/TicketStatusBadge';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import {
    ArrowLeft,
    Ticket as TicketIcon,
    Clock,
    CheckCircle2,
    Loader2,
    PauseCircle,
    User as UserIcon,
    Timer,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BRAND_ICON_BOX, BRAND_PAGE_HEADER, TICKET_STATUS_STYLES } from '@/lib/brand';

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

const MONTH_NAMES = [
    { value: 1, name: 'Januari' },
    { value: 2, name: 'Februari' },
    { value: 3, name: 'Maret' },
    { value: 4, name: 'April' },
    { value: 5, name: 'Mei' },
    { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' },
    { value: 8, name: 'Agustus' },
    { value: 9, name: 'September' },
    { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' },
    { value: 12, name: 'Desember' },
];

function formatDateTime(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatHours(value: string | null): string {
    if (value === null || value === '' || isNaN(Number(value))) return '-';
    const hours = Number(value);

    if (hours < 1) {
        return `${Math.round(hours * 60)} mnt`;
    }
    if (hours < 24) {
        const whole = Math.floor(hours);
        const minutes = Math.round((hours - whole) * 60);
        return minutes > 0 ? `${whole} jam ${minutes} mnt` : `${whole} jam`;
    }
    const days = Math.floor(hours / 24);
    const restHours = Math.round(hours - days * 24);
    return restHours > 0 ? `${days} hari ${restHours} jam` : `${days} hari`;
}

export default function UserTickets({ user, tickets, summary, filters, status_options }: TicketsProps) {
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear - 2; y <= currentYear + 1; y++) {
            years.push(y);
        }
        return years;
    }, []);

    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

    useEffect(() => {
        setSearchTerm(filters.search ?? '');
    }, [filters.search]);

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

        router.get(UserController.tickets({ user: user.id }).url, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusChange = (value: string) => {
        navigate({ status: value === 'all' ? null : value });
    };

    const handleMonthChange = (value: string) => {
        navigate({ month: value === 'all' ? 'all' : parseInt(value, 10) });
    };

    const handleYearChange = (value: string) => {
        navigate({ year: parseInt(value, 10) });
    };

    const submitSearch = () => {
        navigate({ search: searchTerm.trim() === '' ? null : searchTerm.trim() });
    };

    const clearSearch = () => {
        setSearchTerm('');
        navigate({ search: null });
    };

    return (
        <>
            <Head title={`Report Tiket: ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 ${BRAND_PAGE_HEADER}`}>
                    <div className="flex items-center gap-3">
                        <div className={BRAND_ICON_BOX}>
                            <UserIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                <span>{user.email}</span>
                                {user.employee_id && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-border"></span>
                                        <span>ID: {user.employee_id}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" asChild className="shrink-0 w-full sm:w-auto">
                        <Link href={UserController.index().url}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Link>
                    </Button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <SummaryCard label="Total Tiket" value={summary.total} icon={<TicketIcon className="h-4 w-4" />} />
                    <SummaryCard label="Assigned" value={summary.open} icon={<Clock className="h-4 w-4" />} />
                    <SummaryCard label="In Progress" value={summary.in_progress} icon={<Loader2 className="h-4 w-4" />} />
                    <SummaryCard label="Pending" value={summary.pending} icon={<PauseCircle className="h-4 w-4" />} />
                    <SummaryCard label="Closed" value={summary.closed} icon={<CheckCircle2 className="h-4 w-4" />} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Timer className="h-4 w-4" /> Rata-rata Response Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tracking-tight">
                                {summary.avg_response_time_label ?? 'Belum ada data'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Dari created sampai status In Progress</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Rata-rata Resolution Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tracking-tight">
                                {summary.avg_resolution_time_label ?? 'Belum ada data'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Waktu penyelesaian resmi dari {summary.resolved_count} tiket selesai
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
                    <div className="relative w-full lg:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    submitSearch();
                                }
                            }}
                            placeholder="Cari no tiket atau judul..."
                            className="pl-9 pr-9"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                                title="Hapus pencarian"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={filters.month === 'all' ? 'all' : filters.month.toString()} onValueChange={handleMonthChange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Bulan</SelectItem>
                                {MONTH_NAMES.map((m) => (
                                    <SelectItem key={m.value} value={m.value.toString()}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.year.toString()}
                            onValueChange={handleYearChange}
                            disabled={filters.month === 'all'}
                        >
                            <SelectTrigger className="w-[110px]">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                {status_options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tickets table */}
                <Card className="shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                        <th className="px-4 py-3 font-medium">Tiket</th>
                                        <th className="px-4 py-3 font-medium">Kategori</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Created</th>
                                        <th className="px-4 py-3 font-medium">Response Time</th>
                                        <th className="px-4 py-3 font-medium">Completion Date</th>
                                        <th className="px-4 py-3 font-medium">Resolution Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                                <TicketIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                                                Belum ada tiket untuk user ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        tickets.map((ticket) => (
                                            <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-mono text-xs text-muted-foreground">#{ticket.ticket_no}</div>
                                                    <div className="font-medium text-foreground">{ticket.title ?? '-'}</div>
                                                    {ticket.requested_for && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            Untuk: {ticket.requested_for}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <div>{ticket.category ?? '-'}</div>
                                                    {ticket.sub_category && (
                                                        <div className="text-xs text-muted-foreground">{ticket.sub_category}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <TicketStatusBadge status={ticket.status} label={ticket.status_label} />
                                                </td>
                                                <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                                    {ticket.api_creation_date
                                                        ? formatDate(ticket.api_creation_date)
                                                        : formatDateTime(ticket.first_seen_at)}
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    {ticket.response_time_label ? (
                                                        <span className="font-medium text-foreground">{ticket.response_time_label}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                                    {formatDate(ticket.completed_date)}
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    {ticket.resolution_time ? (
                                                        <span className="font-medium text-foreground">
                                                            {formatHours(ticket.resolution_time)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <Card className="shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    {icon}
                    {label}
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            </CardContent>
        </Card>
    );
}

UserTickets.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen User',
            href: UserController.index().url,
        },
        {
            title: 'Report Tiket',
            href: '#',
        },
    ],
};
