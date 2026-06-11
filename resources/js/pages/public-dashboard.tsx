import { Head, Link, router, Deferred } from '@inertiajs/react';
import { BrandHeroHeader } from '@/components/shared/brand-hero-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BRAND, BRAND_LOGO_SRC, TICKET_CHART_COLORS, TICKET_STATUS_STYLES } from '@/lib/brand';
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
    SlidersHorizontal,
    X,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

import { DashboardProps, DashboardFilters, Segment } from '@/types/dashboard';
import { formatDate, formatPeriodLabel } from '@/components/dashboard/helpers';

import { DonutChart } from '@/components/dashboard/DonutChart';
import { DashboardHeaderFilters } from '@/components/dashboard/DashboardHeaderFilters';
import { StatCard, KpiCard, LeaderboardCard, MiniStat } from '@/components/dashboard/MetricCards';
import { EngineerCard } from '@/components/dashboard/EngineerCard';
import { StatCardSkeleton, EngineerCardSkeleton, TableSkeleton } from '@/components/dashboard/Skeletons';
import { TicketStatusBadge } from '@/components/shared/TicketStatusBadge';
import { DisciplineTable } from '@/components/leaderboard/DisciplineTable';
import { LateTrendChart } from '@/components/charts/LateTrendChart';

const AUTO_REFRESH_INTERVAL_SECONDS = 60;

export default function PublicDashboard({
    date,
    attendance,
    ticket_stats,
    kpi_stats,
    companies,
    filters,
    engineers,
    tickets,
    analytics,
    holiday_name,
}: DashboardProps) {
    const stats = attendance?.stats ?? { total_scheduled: 0, total_present: 0, total_absent: 0, total_leave: 0, total_late: 0, total_users: 0, total_early_leave: 0 };
    const employees = attendance?.employees ?? [];
    const isSingleDay = filters.date_from === filters.date_to;

    const attendanceByUserId = new Map(employees.map((emp) => [emp.id, emp]));

    const headerRef = useRef<HTMLDivElement>(null);
    const [showStickyBar, setShowStickyBar] = useState(false);
    const [isTicketsLoading, setIsTicketsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');
    const [activeTab, setActiveTab] = useState('service-desk');
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);
    const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(AUTO_REFRESH_INTERVAL_SECONDS);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoRefresh) {
            interval = setInterval(() => {
                setAutoRefreshCountdown((prev) => {
                    if (prev <= 1) {
                        router.visit(window.location.href, {
                            only: ['attendance', 'ticket_stats', 'kpi_stats', 'engineers', 'tickets', 'analytics'],
                            preserveScroll: true,
                            preserveState: true,
                        });
                        return AUTO_REFRESH_INTERVAL_SECONDS;
                    }
                    return prev - 1;
                });
            }, 1000); // 1 second tick
        } else {
            setAutoRefreshCountdown(AUTO_REFRESH_INTERVAL_SECONDS);
        }
        return () => clearInterval(interval);
    }, [isAutoRefresh]);

    const isTicketFiltersActive = !!filters.search || !!filters.sort_by || !!filters.status;

    const selectedCompany = useMemo(() => {
        return filters.company_id ? companies.find(c => c.id === filters.company_id)?.name : undefined;
    }, [filters.company_id, companies]);

    const handleTicketFiltersReset = () => {
        setSearchQuery('');
        applyFilters({ search: null, sort_by: null, sort_dir: filters.defaults.sort_dir, status: null });
    };

    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyBar(!entry.isIntersecting),
            { threshold: 0 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const applyFilters = useCallback(
        (next: Partial<DashboardFilters>) => {
            const companyId = next.company_id !== undefined ? next.company_id : filters.company_id;
            const dateFrom = next.date_from ?? filters.date_from;
            const dateTo = next.date_to ?? filters.date_to;
            const search = next.search !== undefined ? next.search : filters.search;
            const sortBy = next.sort_by !== undefined ? next.sort_by : filters.sort_by;
            const sortDir = next.sort_dir !== undefined ? next.sort_dir : filters.sort_dir;
            const status = next.status !== undefined ? next.status : filters.status;

            // If all filters match defaults, navigate to clean URL '/'
            const isDefault =
                !companyId &&
                dateFrom === filters.defaults.date_from &&
                dateTo === filters.defaults.date_to &&
                !search &&
                !sortBy &&
                sortDir === filters.defaults.sort_dir &&
                !status;

            const isTicketOnlyChange =
                (next.search !== undefined || next.sort_by !== undefined || next.sort_dir !== undefined || next.status !== undefined) &&
                next.company_id === undefined &&
                next.date_from === undefined &&
                next.date_to === undefined;

            const routerOptions: any = {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsTicketsLoading(true),
                onFinish: () => setIsTicketsLoading(false),
            };

            if (isTicketOnlyChange) {
                routerOptions.only = ['tickets', 'filters'];
            }

            if (isDefault) {
                router.get('/', {}, routerOptions);
                return;
            }

            const params: Record<string, string> = {
                date_from: dateFrom,
                date_to: dateTo,
            };
            if (companyId) {
                params.company_id = String(companyId);
            }
            if (search) {
                params.search = search;
            }
            if (sortBy) {
                params.sort_by = sortBy;
                params.sort_dir = sortDir;
            }
            if (status) {
                params.status = status;
            }

            router.get('/', params, routerOptions);
        },
        [filters],
    );

    useEffect(() => {
        setSearchQuery(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery !== (filters.search ?? '')) {
                applyFilters({ search: searchQuery || null });
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery, filters.search, applyFilters]);

    const handleSortChange = (value: string) => {
        if (value === 'default') {
            applyFilters({ sort_by: null, sort_dir: 'desc' });
            return;
        }

        const [sortBy, sortDir] = value.split(':');
        applyFilters({ sort_by: sortBy, sort_dir: sortDir });
    };

    const handleStatusChange = (value: string) => {
        applyFilters({ status: value === 'all' ? null : value });
    };

    const handleExport = useCallback(() => {
        const params = new URLSearchParams();
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        if (filters.company_id) params.set('company_id', String(filters.company_id));
        if (filters.search) params.set('search', filters.search);
        if (filters.status) params.set('status', filters.status);

        window.location.href = `/export?${params.toString()}`;
    }, [filters]);

    const ticketSegments: Segment[] = ticket_stats ? [
        { label: 'Assigned', value: ticket_stats.assigned, color: TICKET_CHART_COLORS.assigned },
        { label: 'Pending', value: ticket_stats.pending, color: TICKET_CHART_COLORS.pending },
        { label: 'In Progress', value: ticket_stats.in_progress, color: TICKET_CHART_COLORS.inProgress },
    ] : [];

    const attendanceSegments: Segment[] = [
        { label: 'Present', value: stats.total_present, color: BRAND.light },
        { label: 'Absent', value: stats.total_absent, color: '#ef4444' },
        { label: 'On Leave', value: stats.total_leave, color: BRAND.yellow },
    ];

    return (
        <>
            <Head title="Operations Dashboard" />

            <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50/40 to-white text-foreground dark:from-[#0a0a0a] dark:to-[#0a0a0a]">
                <div ref={headerRef}>
                    <BrandHeroHeader
                        badge="Live Operations Board"
                        title="Computer Operations Dashboard"
                        date={date}
                        actions={
                            <div className="flex items-center gap-2">
                                <DashboardHeaderFilters
                                    companies={companies}
                                    filters={filters}
                                    onApply={applyFilters}
                                    onExport={handleExport}
                                    isAutoRefresh={isAutoRefresh}
                                    autoRefreshCountdown={autoRefreshCountdown}
                                    onAutoRefreshToggle={() => setIsAutoRefresh(!isAutoRefresh)}
                                />
                                <Link
                                    href="/login"
                                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#FDD835]/50 bg-[#FDD835] px-4 text-xs font-semibold text-[#1B5E20] shadow-sm transition-all hover:bg-[#FFEB3B] hover:shadow-md"
                                >
                                    Login
                                </Link>
                            </div>
                        }
                    />
                </div>

                {/* Sticky filter bar — only visible when header is scrolled out of view */}
                <div
                    className={`sticky top-0 z-30 border-b border-[#1B5E20]/20 bg-white/80 backdrop-blur-lg shadow-sm dark:bg-[#0a0a0a]/80 dark:border-white/10 ${showStickyBar ? 'visible opacity-100 transition-opacity duration-300' : 'invisible opacity-0'
                        }`}
                >
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:px-8">
                        <div className="hidden items-center gap-3 sm:flex">
                            <img src={BRAND_LOGO_SRC} alt="b-hero" className="h-10 w-10 object-contain" />
                            <div className="flex items-center gap-2 border-r border-[#1B5E20]/20 pr-3 mr-1">
                                <p className="text-sm font-semibold text-[#1B5E20] dark:text-emerald-400">
                                    {isSingleDay ? date : formatPeriodLabel(filters.date_from, filters.date_to)}
                                </p>
                                <span className="text-muted-foreground/40 text-sm">•</span>
                                <div className="flex bg-muted/50 rounded-md p-0.5">
                                    <button
                                        onClick={() => { setActiveTab('service-desk'); }}
                                        className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${activeTab === 'service-desk' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Ticket Overview
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('team-attendance'); }}
                                        className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${activeTab === 'team-attendance' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Team & Attendance
                                    </button>
                                </div>
                            </div>
                            {selectedCompany && (
                                <span className="text-sm font-bold text-[#1B5E20] dark:text-emerald-400">
                                    {selectedCompany}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <DashboardHeaderFilters
                                companies={companies}
                                filters={filters}
                                onApply={applyFilters}
                                onExport={handleExport}
                                isAutoRefresh={isAutoRefresh}
                                autoRefreshCountdown={autoRefreshCountdown}
                                onAutoRefreshToggle={() => setIsAutoRefresh(!isAutoRefresh)}
                                light
                            />
                            <Link
                                href="/login"
                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#FDD835]/50 bg-[#FDD835] px-4 text-xs font-semibold text-[#1B5E20] shadow-sm transition-all hover:bg-[#FFEB3B] hover:shadow-md"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex w-full items-center justify-between mb-6">
                            <TabsList className="grid w-[400px] grid-cols-2">
                                <TabsTrigger value="service-desk">Ticket Overview</TabsTrigger>
                                <TabsTrigger value="team-attendance">Team & Attendance</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="service-desk" className="flex flex-col gap-8 mt-0">
                            {/* Section: Team KPI & Performance */}
                            <section className="flex flex-col gap-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <ArrowUp className="h-5 w-5 text-[#2E7D32]" /> Team KPI & Performance {selectedCompany && `- ${selectedCompany}`}
                                </h2>
                                <p className="-mt-2 text-sm text-muted-foreground">
                                    Global performance metrics and SLAs for {isSingleDay ? 'the selected date' : formatPeriodLabel(filters.date_from, filters.date_to)}.
                                </p>
                                <Deferred data={["kpi_stats", "engineers"]} fallback={
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                                    </div>
                                }>
                                    {kpi_stats && engineers && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <KpiCard
                                                    title="Response SLA"
                                                    value={kpi_stats.current.response_sla_percent}
                                                    isPercentage
                                                    trendCurrent={kpi_stats.current.response_sla_percent}
                                                    trendPrevious={kpi_stats.previous.response_sla_percent}
                                                    subtitle={`Target: < ${kpi_stats.targets.response_sla_seconds / 60} mins`}
                                                />
                                                <KpiCard
                                                    title="Resolution SLA"
                                                    value={kpi_stats.current.resolution_sla_percent}
                                                    isPercentage
                                                    trendCurrent={kpi_stats.current.resolution_sla_percent}
                                                    trendPrevious={kpi_stats.previous.resolution_sla_percent}
                                                    subtitle={`Target: < ${kpi_stats.targets.resolution_sla_hours} hours`}
                                                />
                                                <KpiCard
                                                    title="Avg Response"
                                                    value={kpi_stats.current.avg_response_label ?? '-'}
                                                    trendCurrent={kpi_stats.current.avg_response_seconds}
                                                    trendPrevious={kpi_stats.previous.avg_response_seconds}
                                                    inverse
                                                    subtitle="Global average"
                                                />
                                                <KpiCard
                                                    title="Avg Resolution"
                                                    value={kpi_stats.current.avg_resolution_label ?? '-'}
                                                    trendCurrent={kpi_stats.current.avg_resolution_hours}
                                                    trendPrevious={kpi_stats.previous.avg_resolution_hours}
                                                    inverse
                                                    subtitle="Global average"
                                                />
                                            </div>
                                            <div className="lg:col-span-1">
                                                <LeaderboardCard engineers={engineers} />
                                            </div>
                                        </div>
                                    )}
                                </Deferred>
                            </section>

                            {/* Section: Tickets overview */}
                            <section className="flex flex-col gap-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <TicketIcon className="h-5 w-5 text-[#2E7D32]" /> Ticket Overview {selectedCompany && `- ${selectedCompany}`}
                                </h2>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 -mt-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-muted-foreground">
                                            {isSingleDay ? `Summary for ${formatDate(filters.date_from)}.` : `Summary for ${formatPeriodLabel(filters.date_from, filters.date_to)}.`}
                                        </p>
                                        {isSingleDay && holiday_name && (
                                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400 font-normal shadow-sm">
                                                Hari Libur: {holiday_name}
                                            </Badge>
                                        )}
                                    </div>
                                    {(filters.date_from !== filters.defaults.date_from || filters.date_to !== filters.defaults.date_to) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyFilters({ date_from: filters.defaults.date_from, date_to: filters.defaults.date_to })}
                                            className="h-6 px-2 text-xs"
                                        >
                                            Reset to Today
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                                    <Deferred data="ticket_stats" fallback={<><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>}>
                                        {ticket_stats && (
                                            <>
                                                <StatCard label="Open Tickets" value={ticket_stats.open_total} icon={<Inbox className="h-4 w-4 text-[#2E7D32]" />} accent="bg-green-50 dark:bg-green-950/40" hint="In period" />
                                                <StatCard label="Assigned" value={ticket_stats.assigned} icon={<TicketIcon className="h-4 w-4 text-[#1B5E20]" />} accent="bg-green-50 dark:bg-green-950/40" />
                                                <StatCard label="Pending" value={ticket_stats.pending} icon={<PauseCircle className="h-4 w-4 text-[#F9A825]" />} accent="bg-yellow-50 dark:bg-yellow-950/40" />
                                                <StatCard label="In Progress" value={ticket_stats.in_progress} icon={<Loader2 className="h-4 w-4 text-[#4CAF50]" />} accent="bg-emerald-50 dark:bg-emerald-950/40" />
                                                <StatCard label="Completed" value={ticket_stats.completed_today} icon={<CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />} accent="bg-green-50 dark:bg-green-950/40" />
                                                <StatCard label="Total Tickets" value={ticket_stats.created_today} icon={<Sparkles className="h-4 w-4 text-[#FDD835]" />} accent="bg-yellow-50 dark:bg-yellow-950/40" />
                                            </>
                                        )}
                                    </Deferred>
                                </div>

                                <Deferred data={["ticket_stats", "attendance"]} fallback={
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                        <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-48"></CardContent></Card>
                                        <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-48"></CardContent></Card>
                                        <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-48"></CardContent></Card>
                                    </div>
                                }>
                                    {ticket_stats && attendance && (
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                            <Card className="border-border/60 shadow-sm">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Ticket Distribution</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <DonutChart segments={ticketSegments} centerLabel="Active" centerValue={ticket_stats.open_total} />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </Deferred>
                            </section>

                            {/* Section: Engineer Ticket Workload */}
                            <section className="flex flex-col gap-4">
                                <div>
                                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                                        <Users className="h-5 w-5 text-[#2E7D32]" /> Team Ticket Workload
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Engineer ticket workload for the selected filters.
                                    </p>
                                </div>
                                <Deferred data={["engineers", "attendance"]} fallback={
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        <EngineerCardSkeleton /><EngineerCardSkeleton /><EngineerCardSkeleton />
                                    </div>
                                }>
                                    {engineers && attendance && (
                                        engineers.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {engineers.map((engineer) => (
                                                    <EngineerCard
                                                        key={engineer.id}
                                                        engineer={engineer}
                                                        attendance={attendanceByUserId.get(engineer.id) ?? null}
                                                        variant="tickets"
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <Card className="border-border/60 shadow-sm">
                                                <CardContent className="p-8 text-center text-muted-foreground">No engineers registered yet.</CardContent>
                                            </Card>
                                        )
                                    )}
                                </Deferred>
                            </section>

                            {/* Section: Latest tickets table */}
                            <section className="flex flex-col gap-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                                        <TicketIcon className="h-5 w-5 text-[#2E7D32]" /> Tickets in Period
                                    </h2>
                                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                        <Input
                                            placeholder="Search ticket or engineer..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-9 w-full bg-white dark:bg-black sm:w-64"
                                        />
                                        <Select
                                            value={filters.sort_by ? `${filters.sort_by}:${filters.sort_dir}` : 'default'}
                                            onValueChange={handleSortChange}
                                        >
                                            <SelectTrigger className="h-9 w-full bg-white dark:bg-black sm:w-44">
                                                <SelectValue placeholder="Sort By" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Sort: Default</SelectItem>
                                                <SelectItem value="response_time:asc">Resp. Time (Fastest)</SelectItem>
                                                <SelectItem value="response_time:desc">Resp. Time (Slowest)</SelectItem>
                                                <SelectItem value="resolution_time:asc">Res. Time (Fastest)</SelectItem>
                                                <SelectItem value="resolution_time:desc">Res. Time (Slowest)</SelectItem>
                                                <SelectItem value="created_date:asc">Created (Asc)</SelectItem>
                                                <SelectItem value="created_date:desc">Created (Desc)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={filters.status ?? 'all'}
                                            onValueChange={handleStatusChange}
                                        >
                                            <SelectTrigger className="h-9 w-full bg-white dark:bg-black sm:w-36">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="assigned">Assigned</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="pending_on_hold">Pending/On Hold</SelectItem>
                                                <SelectItem value="closed">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {isTicketFiltersActive && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={handleTicketFiltersReset}
                                                className="h-9 px-2 text-xs cursor-pointer text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                                            >
                                                <X className="h-3.5 w-3.5 mr-1" />
                                                Reset
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <Deferred data="tickets" fallback={<TableSkeleton />}>
                                    {tickets && (
                                        isTicketsLoading ? <TableSkeleton /> : (
                                            <Card className="border-border/60 shadow-sm">
                                                <CardContent className="p-0">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                                                    <th className="px-4 py-3 font-medium">Ticket</th>
                                                                    <th className="px-4 py-3 font-medium">Category</th>
                                                                    <th className="px-4 py-3 font-medium">Engineer</th>
                                                                    <th className="px-4 py-3 font-medium">Resp. Time</th>
                                                                    <th className="px-4 py-3 font-medium">Res. Time</th>
                                                                    <th className="px-4 py-3 font-medium">Status</th>
                                                                    <th className="px-4 py-3 font-medium">Created</th>
                                                                    <th className="px-4 py-3 font-medium">Completed</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {tickets.data.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                                                            <TicketIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                                                                            No tickets yet.
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    tickets.data.map((ticket, i) => (
                                                                        <tr key={i} className="group hover:bg-muted/30 transition-colors">
                                                                            <td className="px-4 py-3 align-top">
                                                                                <div className="font-semibold text-foreground">{ticket.ticket_no}</div>
                                                                                <div className="text-muted-foreground truncate max-w-[200px]" title={ticket.title ?? undefined}>{ticket.title}</div>
                                                                                {ticket.requested_for && (
                                                                                    <div className="mt-0.5 text-xs text-muted-foreground">For: {ticket.requested_for}</div>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-3 align-top text-muted-foreground">{ticket.category ?? '-'}</td>
                                                                            <td className="px-4 py-3 align-top">{ticket.assigned_user?.name ?? ticket.assigned_to_name ?? '-'}</td>
                                                                            <td className="px-4 py-3 align-top font-medium text-foreground">{ticket.response_time_label ?? '-'}</td>
                                                                            <td className="px-4 py-3 align-top font-medium text-foreground">{ticket.resolution_time_label ?? '-'}</td>
                                                                            <td className="px-4 py-3 align-top">
                                                                                <TicketStatusBadge status={ticket.status} label={ticket.status_label} />
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
                                                                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${link.active
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
                                        )
                                    )}
                                </Deferred>
                            </section>

                        </TabsContent>

                        <TabsContent value="team-attendance" className="flex flex-col gap-8 mt-0">
                            {/* Section: Attendance Overview */}
                            <section className="flex flex-col gap-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <Users className="h-5 w-5 text-[#2E7D32]" /> Attendance Overview {selectedCompany && `- ${selectedCompany}`}
                                </h2>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 -mt-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-muted-foreground">
                                            {isSingleDay ? `Summary for ${formatDate(filters.date_from)}.` : `Summary for ${formatPeriodLabel(filters.date_from, filters.date_to)}.`}
                                        </p>
                                        {isSingleDay && holiday_name && (
                                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400 font-normal shadow-sm">
                                                Hari Libur: {holiday_name}
                                            </Badge>
                                        )}
                                    </div>
                                    {(filters.date_from !== filters.defaults.date_from || filters.date_to !== filters.defaults.date_to) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyFilters({ date_from: filters.defaults.date_from, date_to: filters.defaults.date_to })}
                                            className="h-6 px-2 text-xs"
                                        >
                                            Reset to Today
                                        </Button>
                                    )}
                                </div>
                                <Deferred data={["attendance"]} fallback={
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-48"></CardContent></Card>
                                        <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-48"></CardContent></Card>
                                    </div>
                                }>
                                    {attendance && (
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                                    )}
                                </Deferred>

                                <Deferred data={["analytics"]} fallback={
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                        <Card className="border-border/60 shadow-sm animate-pulse lg:col-span-1"><CardContent className="h-64"></CardContent></Card>
                                        <Card className="border-border/60 shadow-sm animate-pulse lg:col-span-2"><CardContent className="h-64"></CardContent></Card>
                                    </div>
                                }>
                                    {analytics && (
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                            <div className="lg:col-span-1">
                                                <DisciplineTable leaderboard={analytics.leaderboard.slice(0, 10)} />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <LateTrendChart data={analytics.lateTrend} />
                                            </div>
                                        </div>
                                    )}
                                </Deferred>
                            </section>

                            {/* Section: Team overview (attendance + tickets) */}
                            <section className="flex flex-col gap-4">
                                <div>
                                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                                        <Users className="h-5 w-5 text-[#2E7D32]" /> Team Operations Overview {selectedCompany && `- ${selectedCompany}`}
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Engineer attendance and ticket workload for the selected filters.
                                    </p>
                                </div>
                                <Deferred data={["engineers", "attendance"]} fallback={
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        <EngineerCardSkeleton /><EngineerCardSkeleton /><EngineerCardSkeleton />
                                    </div>
                                }>
                                    {engineers && attendance && (
                                        engineers.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {engineers.map((engineer) => {
                                                    const periodStr = filters.date_from === filters.date_to
                                                        ? filters.date_from
                                                        : `${filters.date_from} to ${filters.date_to}`;

                                                    return (
                                                        <EngineerCard
                                                            key={engineer.id}
                                                            engineer={engineer}
                                                            attendance={attendanceByUserId.get(engineer.id) ?? null}
                                                            variant="attendance"
                                                            periodDateStr={periodStr}
                                                            companyName={selectedCompany}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Card className="border-border/60 shadow-sm">
                                                <CardContent className="p-8 text-center text-muted-foreground">No engineers registered yet.</CardContent>
                                            </Card>
                                        )
                                    )}
                                </Deferred>
                            </section>

                        </TabsContent>

                    </Tabs>
                </div>

                <footer className="mt-auto border-t border-black/5 dark:border-white/5 py-6 text-center text-xs text-gray-500">
                    © 2026, Developed by <a href='#' className='text-gray-600 font-bold hover:text-gray-900 transition-colors'>IT Computer Operations</a>
                </footer>
            </div>

            {/* Floating Scroll to Top Button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#1B5E20] text-white shadow-lg transition-all duration-300 hover:bg-[#1B5E20]/90 hover:scale-105 active:scale-95 ${showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
                    }`}
                title="Scroll to Top"
            >
                <ArrowUp className="h-5 w-5" />
            </button>
        </>
    );
}
