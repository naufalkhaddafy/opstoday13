import { Head, Link, router } from '@inertiajs/react';
import { BrandHeroHeader } from '@/components/shared/brand-hero-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BRAND, TICKET_CHART_COLORS, TICKET_STATUS_STYLES } from '@/lib/brand';
import {
    UserCheck,
    UserX,
    Clock,
    CalendarClock,
    Ticket as TicketIcon,
    Loader2,
    PauseCircle,
    CheckCircle2,
    Inbox,
    Sparkles,
    Timer,
    Users,
    Building2,
    Download,
} from 'lucide-react';
import { useCallback } from 'react';

type AttendanceStats = {
    total_users: number;
    total_scheduled: number;
    total_present: number;
    total_leave: number;
    total_absent: number;
    total_late: number;
    total_early_leave: number;
};

type EmployeeStatus = {
    id: number;
    name: string;
    shift_name: string;
    shift_time: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
    late_minutes: number;
    leave_description: string | null;
};

type TicketStats = {
    assigned: number;
    pending: number;
    in_progress: number;
    open_total: number;
    completed_today: number;
    created_today: number;
};

type EngineerSummary = {
    id: number;
    name: string;
    employee_id: string | null;
    assigned: number;
    pending: number;
    in_progress: number;
    completed_today: number;
    total: number;
    avg_response_time_seconds: number | null;
    avg_response_time_label: string | null;
    avg_resolution_time_hours: number | null;
    avg_resolution_time_label: string | null;
};

type TicketRow = {
    id: number;
    ticket_no: string;
    title: string | null;
    category: string | null;
    status: 'assigned' | 'pending_on_hold' | 'in_progress' | 'closed' | null;
    status_label: string | null;
    assigned_to_name: string | null;
    assigned_user: { id: number; name: string } | null;
    requested_for: string | null;
    created_date: string | null;
    completed_date: string | null;
    updated_at: string | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type CompanyOption = { id: number; name: string };

type DashboardFilters = {
    company_id: number | null;
    date_from: string;
    date_to: string;
    defaults: {
        company_id: number | null;
        date_from: string;
        date_to: string;
    };
};

type DashboardProps = {
    date: string;
    attendance: { stats: AttendanceStats; employees: EmployeeStatus[] };
    ticket_stats: TicketStats;
    companies: CompanyOption[];
    filters: DashboardFilters;
    engineers: EngineerSummary[];
    tickets: {
        data: TicketRow[];
        meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
        links: PaginationLink[];
    };
};

const ATTENDANCE_LABELS: Record<string, string> = {
    hadir: 'Present',
    tidak_lengkap: 'Incomplete',
    sakit: 'Sick Leave',
    izin: 'Permission',
    cuti: 'Leave',
    absen: 'Absent',
    tidak_hadir: 'Absent',
    off_day: 'Day Off',
};

function attendanceBadge(status: string) {
    switch (status) {
        case 'hadir':
        case 'tidak_lengkap':
            return <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">{ATTENDANCE_LABELS[status]}</Badge>;
        case 'sakit':
        case 'izin':
        case 'cuti':
            return <Badge className="border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{ATTENDANCE_LABELS[status]}</Badge>;
        case 'absen':
        case 'tidak_hadir':
            return <Badge className="border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">{ATTENDANCE_LABELS[status]}</Badge>;
        default:
            return <Badge variant="outline" className="bg-muted/50 text-muted-foreground">{ATTENDANCE_LABELS.off_day}</Badge>;
    }
}

function formatDate(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatShiftName(name: string): string {
    return name === 'Libur' ? 'Day Off' : name;
}

function formatPeriodLabel(dateFrom: string, dateTo: string): string {
    const from = new Date(`${dateFrom}T00:00:00`);
    const to = new Date(`${dateTo}T00:00:00`);
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    if (dateFrom === dateTo) {
        return from.toLocaleDateString('en-US', opts);
    }
    return `${from.toLocaleDateString('en-US', opts)} – ${to.toLocaleDateString('en-US', opts)}`;
}

type Segment = { label: string; value: number; color: string };

function DonutChart({ segments, centerLabel, centerValue }: { segments: Segment[]; centerLabel: string; centerValue: number }) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex items-center gap-5">
            <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/40" />
                    {total > 0 &&
                        segments.map((seg, i) => {
                            const length = (seg.value / total) * circumference;
                            const dash = `${length} ${circumference - length}`;
                            const circle = (
                                <circle
                                    key={i}
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="none"
                                    stroke={seg.color}
                                    strokeWidth="10"
                                    strokeDasharray={dash}
                                    strokeDashoffset={-offset}
                                    strokeLinecap="butt"
                                />
                            );
                            offset += length;
                            return circle;
                        })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold leading-none text-foreground">{centerValue}</span>
                    <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{centerLabel}</span>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: seg.color }} />
                        <span className="text-muted-foreground">{seg.label}</span>
                        <span className="ml-auto font-semibold text-foreground">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DashboardHeaderFilters({
    companies,
    filters,
    onApply,
    onExport,
}: {
    companies: CompanyOption[];
    filters: DashboardFilters;
    onApply: (next: Partial<DashboardFilters>) => void;
    onExport: () => void;
}) {
    return (
        <div className="flex w-full flex-col gap-2 rounded-lg border border-white/20 bg-white/10 p-2 backdrop-blur-sm lg:w-auto lg:flex-row lg:items-end lg:gap-3">
            <div className="space-y-2">
                <Label htmlFor="company-filter" className="mb-0 block text-[10px] font-medium uppercase tracking-wide text-white/70">
                    <span className="flex items-center gap-1">
                        <Building2 className="h-2.5 w-2.5" /> Company
                    </span>
                </Label>
                <Select
                    value={filters.company_id ? String(filters.company_id) : 'all'}
                    onValueChange={(value) => onApply({ company_id: value === 'all' ? null : Number(value) })}
                >
                    <SelectTrigger id="company-filter" className="h-8 w-full min-w-[120px] border-white/30 bg-white px-2.5 text-xs text-foreground lg:w-[132px]">
                        <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All companies</SelectItem>
                        {companies.map((company) => (
                            <SelectItem key={company.id} value={String(company.id)}>
                                {company.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="date-from" className="mb-0 block text-[10px] font-medium uppercase tracking-wide text-white/70">From</Label>
                <Input
                    id="date-from"
                    type="date"
                    className="h-8 w-full border-white/30 bg-white px-2.5 text-xs text-foreground lg:w-[124px]"
                    value={filters.date_from}
                    onChange={(e) => onApply({ date_from: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="date-to" className="mb-0 block text-[10px] font-medium uppercase tracking-wide text-white/70">To</Label>
                <Input
                    id="date-to"
                    type="date"
                    className="h-8 w-full border-white/30 bg-white px-2.5 text-xs text-foreground lg:w-[124px]"
                    value={filters.date_to}
                    onChange={(e) => onApply({ date_to: e.target.value })}
                />
            </div>
            <div className="hidden self-stretch lg:my-0.5 lg:block lg:w-px lg:bg-white/20" />
            <div className="space-y-2">
                <Label className="mb-0 block text-[10px] font-medium uppercase tracking-wide text-white/70">
                    <span className="flex items-center gap-1">
                        <Download className="h-2.5 w-2.5" /> Export
                    </span>
                </Label>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onExport}
                    className="h-8 w-full gap-1.5 border-white/30 bg-white px-2.5 text-xs font-medium text-[#1B5E20] shadow-none hover:bg-white/90 lg:w-[92px]"
                >
                    <Download className="h-3.5 w-3.5 text-[#2E7D32]" />
                    Export
                </Button>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
    accent,
    hint,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    accent: string;
    hint?: string;
}) {
    return (
        <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
                </div>
                <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</div>
                {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
            </CardContent>
        </Card>
    );
}

function EngineerCard({ engineer, attendance }: { engineer: EngineerSummary; attendance?: EmployeeStatus | null }) {
    const initials = engineer.name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase();

    const max = Math.max(engineer.assigned, engineer.pending, engineer.in_progress, engineer.completed_today, 1);
    const bars = [
        { label: 'Assigned', value: engineer.assigned, color: TICKET_CHART_COLORS.assigned },
        { label: 'Pending', value: engineer.pending, color: TICKET_CHART_COLORS.pending },
        { label: 'In Progress', value: engineer.in_progress, color: TICKET_CHART_COLORS.inProgress },
        { label: 'Completed', value: engineer.completed_today, color: TICKET_CHART_COLORS.completed },
    ];

    return (
        <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] text-sm font-semibold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">{engineer.name}</p>
                                <p className="text-xs text-muted-foreground">{engineer.employee_id ?? '-'}</p>
                            </div>
                            {attendance ? attendanceBadge(attendance.status) : (
                                <Badge variant="outline" className="shrink-0 bg-muted/50 text-muted-foreground">No data</Badge>
                            )}
                        </div>

                        {attendance && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3 text-[#2E7D32]" />
                                    {formatShiftName(attendance.shift_name)} · {attendance.shift_time}
                                </span>
                                {(attendance.check_in || attendance.check_out) && (
                                    <span className="font-mono">
                                        {attendance.check_in ? `In ${attendance.check_in}` : ''}
                                        {attendance.check_in && attendance.check_out ? ' · ' : ''}
                                        {attendance.check_out ? `Out ${attendance.check_out}` : ''}
                                    </span>
                                )}
                                {attendance.late_minutes > 0 && (
                                    <span className="font-medium text-rose-600">Late {attendance.late_minutes}m</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 border-t pt-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tickets in Period</span>
                        <span className="text-lg font-bold text-foreground">{engineer.total}</span>
                    </div>
                    <div className="space-y-2">
                        {bars.map((bar) => (
                            <div key={bar.label} className="flex items-center gap-2">
                                <span className="w-20 shrink-0 text-[11px] text-muted-foreground">{bar.label}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${(bar.value / max) * 100}%`, backgroundColor: bar.color }}
                                    />
                                </div>
                                <span className="w-5 text-right text-xs font-semibold text-foreground">{bar.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                        <div className="rounded-lg border border-green-200/60 bg-green-50/50 p-2.5 dark:border-green-900/40 dark:bg-green-950/20">
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                <Timer className="h-3 w-3 text-[#2E7D32]" />
                                Avg Response
                            </div>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                                {engineer.avg_response_time_label ?? 'No data'}
                            </p>
                        </div>
                        <div className="rounded-lg border border-yellow-200/60 bg-yellow-50/50 p-2.5 dark:border-yellow-900/40 dark:bg-yellow-950/20">
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-[#F9A825]" />
                                Avg Resolution
                            </div>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                                {engineer.avg_resolution_time_label ?? 'No data'}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PublicDashboard({
    date,
    attendance,
    ticket_stats,
    companies,
    filters,
    engineers,
    tickets,
}: DashboardProps) {
    const { stats, employees } = attendance;
    const isSingleDay = filters.date_from === filters.date_to;

    const attendanceByUserId = new Map(employees.map((emp) => [emp.id, emp]));

    const applyFilters = useCallback(
        (next: Partial<DashboardFilters>) => {
            const companyId = next.company_id !== undefined ? next.company_id : filters.company_id;

            const params: Record<string, string> = {
                date_from: next.date_from ?? filters.date_from,
                date_to: next.date_to ?? filters.date_to,
            };
            if (companyId) {
                params.company_id = String(companyId);
            }

            router.get('/', params, { preserveState: true, preserveScroll: true, replace: true });
        },
        [filters],
    );

    const handleExport = useCallback(() => {
        // TODO: export dashboard data based on current filters
    }, []);

    const ticketSegments: Segment[] = [
        { label: 'Assigned', value: ticket_stats.assigned, color: TICKET_CHART_COLORS.assigned },
        { label: 'Pending', value: ticket_stats.pending, color: TICKET_CHART_COLORS.pending },
        { label: 'In Progress', value: ticket_stats.in_progress, color: TICKET_CHART_COLORS.inProgress },
    ];

    const attendanceSegments: Segment[] = [
        { label: 'Present', value: stats.total_present, color: BRAND.light },
        { label: 'Absent', value: stats.total_absent, color: '#ef4444' },
        { label: 'On Leave', value: stats.total_leave, color: BRAND.yellow },
    ];

    return (
        <>
            <Head title="Operations Dashboard" />

            <div className="min-h-screen bg-gradient-to-b from-green-50/40 to-white text-foreground dark:from-[#0a0a0a] dark:to-[#0a0a0a]">
                <BrandHeroHeader
                    badge="Live Operations Board"
                    title="Computer Operations Dashboard"
                    date={date}
                    actions={
                        <DashboardHeaderFilters
                            companies={companies}
                            filters={filters}
                            onApply={applyFilters}
                            onExport={handleExport}
                        />
                    }
                />

                <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
                    {/* Section: Tickets overview */}
                    <section className="flex flex-col gap-4">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <TicketIcon className="h-5 w-5 text-[#2E7D32]" /> Ticket Overview
                        </h2>
                        <p className="-mt-2 text-sm text-muted-foreground">
                            {isSingleDay ? 'Summary for selected date.' : `Summary for ${formatPeriodLabel(filters.date_from, filters.date_to)}.`}
                        </p>

                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                            <StatCard label="Open Tickets" value={ticket_stats.open_total} icon={<Inbox className="h-4 w-4 text-[#2E7D32]" />} accent="bg-green-50 dark:bg-green-950/40" hint="In period" />
                            <StatCard label="Assigned" value={ticket_stats.assigned} icon={<TicketIcon className="h-4 w-4 text-[#1B5E20]" />} accent="bg-green-50 dark:bg-green-950/40" />
                            <StatCard label="Pending" value={ticket_stats.pending} icon={<PauseCircle className="h-4 w-4 text-[#F9A825]" />} accent="bg-yellow-50 dark:bg-yellow-950/40" />
                            <StatCard label="In Progress" value={ticket_stats.in_progress} icon={<Loader2 className="h-4 w-4 text-[#4CAF50]" />} accent="bg-emerald-50 dark:bg-emerald-950/40" />
                            <StatCard label="Completed" value={ticket_stats.completed_today} icon={<CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />} accent="bg-green-50 dark:bg-green-950/40" />
                            <StatCard label="Total Tickets" value={ticket_stats.created_today} icon={<Sparkles className="h-4 w-4 text-[#FDD835]" />} accent="bg-yellow-50 dark:bg-yellow-950/40" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Ticket Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DonutChart segments={ticketSegments} centerLabel="Active" centerValue={ticket_stats.open_total} />
                                </CardContent>
                            </Card>

                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {isSingleDay ? 'Attendance' : `Attendance · ${formatPeriodLabel(filters.date_to, filters.date_to)}`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DonutChart segments={attendanceSegments} centerLabel="Scheduled" centerValue={stats.total_scheduled} />
                                </CardContent>
                            </Card>

                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Users className="h-4 w-4" /> Team Attendance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-3">
                                    <MiniStat label="Present" value={stats.total_present} icon={<UserCheck className="h-4 w-4 text-[#4CAF50]" />} />
                                    <MiniStat label="Absent" value={stats.total_absent} icon={<UserX className="h-4 w-4 text-rose-500" />} />
                                    <MiniStat label="Late" value={stats.total_late} icon={<Clock className="h-4 w-4 text-[#FDD835]" />} />
                                    <MiniStat label="On Leave" value={stats.total_leave} icon={<CalendarClock className="h-4 w-4 text-[#2E7D32]" />} />
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Section: Team overview (attendance + tickets) */}
                    <section className="flex flex-col gap-4">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <Users className="h-5 w-5 text-[#2E7D32]" /> Team Operations Overview
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Engineer attendance and ticket workload for the selected filters.
                            </p>
                        </div>
                        {engineers.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {engineers.map((engineer) => (
                                    <EngineerCard
                                        key={engineer.id}
                                        engineer={engineer}
                                        attendance={attendanceByUserId.get(engineer.id) ?? null}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card className="border-border/60 shadow-sm">
                                <CardContent className="p-8 text-center text-muted-foreground">No engineers registered yet.</CardContent>
                            </Card>
                        )}
                    </section>

                    {/* Section: Latest tickets table */}
                    <section className="flex flex-col gap-4">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <TicketIcon className="h-5 w-5 text-[#2E7D32]" /> Tickets in Period
                        </h2>
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                                <th className="px-4 py-3 font-medium">Ticket</th>
                                                <th className="px-4 py-3 font-medium">Category</th>
                                                <th className="px-4 py-3 font-medium">Engineer</th>
                                                <th className="px-4 py-3 font-medium">Status</th>
                                                <th className="px-4 py-3 font-medium">Created</th>
                                                <th className="px-4 py-3 font-medium">Completed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                        <TicketIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                                                        No tickets yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                tickets.data.map((ticket) => (
                                                    <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30">
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="font-mono text-xs text-muted-foreground">#{ticket.ticket_no}</div>
                                                            <div className="font-medium text-foreground">{ticket.title ?? '-'}</div>
                                                            {ticket.requested_for && (
                                                                <div className="mt-0.5 text-xs text-muted-foreground">For: {ticket.requested_for}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-muted-foreground">{ticket.category ?? '-'}</td>
                                                        <td className="px-4 py-3 align-top">{ticket.assigned_user?.name ?? ticket.assigned_to_name ?? '-'}</td>
                                                        <td className="px-4 py-3 align-top">
                                                            <Badge variant="outline" className={ticket.status ? TICKET_STATUS_STYLES[ticket.status] : ''}>
                                                                {ticket.status_label ?? '-'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">{formatDate(ticket.created_date)}</td>
                                                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">{formatDate(ticket.completed_date)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {tickets.meta.last_page > 1 && (
                                    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
                                        <p className="text-xs text-muted-foreground">
                                            Showing {tickets.meta.from ?? 0}-{tickets.meta.to ?? 0} of {tickets.meta.total} tickets
                                        </p>
                                        <div className="flex flex-wrap items-center gap-1">
                                            {tickets.links.map((link, i) =>
                                                link.url ? (
                                                    <Link
                                                        key={i}
                                                        href={link.url}
                                                        preserveScroll
                                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                                            link.active
                                                                ? 'bg-[#2E7D32] text-white'
                                                                : 'border bg-background text-foreground hover:bg-muted'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span
                                                        key={i}
                                                        className="rounded-md px-3 py-1.5 text-xs text-muted-foreground/40"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <footer className="pb-8 pt-2 text-center text-xs text-muted-foreground">
                        © 2026, developed by IT Computer Operations
                    </footer>
                </div>
            </div>
        </>
    );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 rounded-lg border bg-card/60 p-3">
            {icon}
            <div>
                <div className="text-lg font-bold leading-none text-foreground">{value}</div>
                <div className="text-[11px] text-muted-foreground">{label}</div>
            </div>
        </div>
    );
}
