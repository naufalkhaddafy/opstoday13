import { Head, Link, usePage } from '@inertiajs/react';
import { BrandHeroHeader } from '@/components/shared/brand-hero-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BRAND, TICKET_CHART_COLORS } from '@/lib/brand';
import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { DashboardProps, Segment } from '@/types/dashboard';
import { DashboardHeaderFilters } from '@/components/dashboard/DashboardHeaderFilters';
import { StickyFilterBar } from '@/components/dashboard/StickyFilterBar';
import { useDashboardFilters } from '@/hooks/use-dashboard-filters';
import { KpiPerformanceSection } from '@/components/dashboard/sections/KpiPerformanceSection';
import { TicketOverviewSection } from '@/components/dashboard/sections/TicketOverviewSection';
import { EngineerWorkloadSection } from '@/components/dashboard/sections/EngineerWorkloadSection';
import { TicketsTableSection } from '@/components/dashboard/sections/TicketsTableSection';
import { TeamAttendanceTab } from '@/components/dashboard/sections/TeamAttendanceTab';

export default function PublicDashboard({
    date,
    attendance,
    ticket_stats,
    kpi_stats,
    companies,
    filters,
    workGroups,
    engineers,
    tickets,
    analytics,
    holiday_name,
}: DashboardProps) {
    const { app_version } = usePage().props as any;
    const stats = attendance?.stats ?? { total_scheduled: 0, total_present: 0, total_absent: 0, total_leave: 0, total_late: 0, total_users: 0, total_early_leave: 0 };
    const employees = attendance?.employees ?? [];
    const isSingleDay = filters.date_from === filters.date_to;

    const attendanceByUserId = new Map(employees.map((emp) => [emp.id, emp]));

    const headerRef = useRef<HTMLDivElement>(null);
    const [showStickyBar, setShowStickyBar] = useState(false);
    const [activeTab, setActiveTab] = useState('service-desk');
    const [slaMode, setSlaMode] = useState<'week' | 'month' | 'year'>('week');

    const {
        searchQuery,
        setSearchQuery,
        isTicketsLoading,
        setIsTicketsLoading,
        isAutoRefresh,
        setIsAutoRefresh,
        autoRefreshCountdown,
        isExporting,
        selectedCompany,
        isTicketFiltersActive,
        applyFilters,
        handleTicketFiltersReset,
        handleSortChange,
        handleStatusChange,
        handleTrendClick,
        handleExport,
    } = useDashboardFilters(filters, companies);

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
                        title="Computer Operations"
                        date={date}
                        actions={
                            <div className="flex items-center gap-2">
                                <DashboardHeaderFilters
                                    companies={companies}
                                    workGroups={workGroups}
                                    filters={filters}
                                    onApply={applyFilters}
                                    onExport={handleExport}
                                    isExporting={isExporting}
                                    isAutoRefresh={isAutoRefresh}
                                    autoRefreshCountdown={autoRefreshCountdown}
                                    onAutoRefreshToggle={() => setIsAutoRefresh(!isAutoRefresh)}
                                />
                                <Link
                                    href="/dashboard"
                                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#FDD835]/50 bg-[#FDD835] px-4 text-xs font-semibold text-[#1B5E20] shadow-sm transition-all hover:bg-[#FFEB3B] hover:shadow-md"
                                >
                                    Dashboard
                                </Link>
                            </div>
                        }
                    />
                </div>

                {/* Sticky filter bar — only visible when header is scrolled out of view */}
                <StickyFilterBar
                    visible={showStickyBar}
                    date={date}
                    isSingleDay={isSingleDay}
                    filters={filters}
                    companies={companies}
                    workGroups={workGroups}
                    selectedCompany={selectedCompany}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onApply={applyFilters}
                    onExport={handleExport}
                    isExporting={isExporting}
                    isAutoRefresh={isAutoRefresh}
                    autoRefreshCountdown={autoRefreshCountdown}
                    onAutoRefreshToggle={() => setIsAutoRefresh(!isAutoRefresh)}
                />

                <div className="flex-1 w-full mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex w-full items-center justify-between mb-6">
                            <TabsList className="grid w-[400px] grid-cols-2">
                                <TabsTrigger value="service-desk">Ticket Overview</TabsTrigger>
                                <TabsTrigger value="team-attendance">Team & Attendance</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="service-desk" className="flex flex-col gap-8 mt-0">
                            <KpiPerformanceSection
                                selectedCompany={selectedCompany}
                                isSingleDay={isSingleDay}
                                dateFrom={filters.date_from}
                                dateTo={filters.date_to}
                                kpiStats={kpi_stats}
                                engineers={engineers}
                                analytics={analytics}
                                slaMode={slaMode}
                                onSlaModeChange={setSlaMode}
                            />
                            <TicketOverviewSection
                                selectedCompany={selectedCompany}
                                isSingleDay={isSingleDay}
                                dateFrom={filters.date_from}
                                dateTo={filters.date_to}
                                defaultDateFrom={filters.defaults.date_from}
                                defaultDateTo={filters.defaults.date_to}
                                holidayName={holiday_name}
                                ticketStats={ticket_stats}
                                attendance={attendance}
                                analytics={analytics}
                                ticketSegments={ticketSegments}
                                onResetToToday={() => applyFilters({ date_from: filters.defaults.date_from, date_to: filters.defaults.date_to })}
                                onTrendClick={handleTrendClick}
                            />
                            <EngineerWorkloadSection
                                engineers={engineers}
                                attendance={attendance}
                                attendanceByUserId={attendanceByUserId}
                                slaHighTicketLoad={filters.slaHighTicketLoad}
                            />
                            <TicketsTableSection
                                searchQuery={searchQuery}
                                onSearchQueryChange={setSearchQuery}
                                filters={filters}
                                onSortChange={handleSortChange}
                                onStatusChange={handleStatusChange}
                                isTicketFiltersActive={isTicketFiltersActive}
                                onResetFilters={handleTicketFiltersReset}
                                tickets={tickets}
                                isTicketsLoading={isTicketsLoading}
                                onStartLoading={() => setIsTicketsLoading(true)}
                                onFinishLoading={() => setIsTicketsLoading(false)}
                            />
                        </TabsContent>

                        <TabsContent value="team-attendance" className="flex flex-col gap-8 mt-0">
                            <TeamAttendanceTab
                                selectedCompany={selectedCompany}
                                isSingleDay={isSingleDay}
                                dateFrom={filters.date_from}
                                dateTo={filters.date_to}
                                defaultDateFrom={filters.defaults.date_from}
                                defaultDateTo={filters.defaults.date_to}
                                holidayName={holiday_name}
                                attendance={attendance}
                                stats={stats}
                                attendanceSegments={attendanceSegments}
                                analytics={analytics}
                                engineers={engineers}
                                attendanceByUserId={attendanceByUserId}
                                onResetToToday={() => applyFilters({ date_from: filters.defaults.date_from, date_to: filters.defaults.date_to })}
                            />
                        </TabsContent>

                    </Tabs>
                </div>

                <footer className="mt-auto border-t border-black/5 dark:border-white/5 py-6 text-center text-xs text-gray-500">
                    <div>© 2026, Developed by <a href='#' className='text-gray-600 font-bold hover:text-gray-900 transition-colors'>IT Computer Operations</a></div>
                    {app_version && <div className="mt-1 font-mono uppercase opacity-50 text-[10px]">{app_version}</div>}
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
