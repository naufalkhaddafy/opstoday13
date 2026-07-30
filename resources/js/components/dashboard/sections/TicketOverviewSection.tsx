import { Deferred } from '@inertiajs/react';
import { Ticket as TicketIcon, Inbox, PauseCircle, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/MetricCards';
import { StatCardSkeleton } from '@/components/dashboard/Skeletons';
import { DonutChart } from '@/components/dashboard/DonutChart';
import { WorkGroupChart } from '@/components/charts/WorkGroupChart';
import { IssueTrendPanel } from '@/components/analytics/IssueTrendPanel';
import { formatDate, formatPeriodLabel } from '@/components/dashboard/helpers';
import { Segment } from '@/types/dashboard';

interface TicketOverviewSectionProps {
    selectedCompany?: string;
    isSingleDay: boolean;
    dateFrom: string;
    dateTo: string;
    defaultDateFrom: string;
    defaultDateTo: string;
    holidayName?: string | null;
    ticketStats?: any;
    attendance?: any;
    analytics?: any;
    ticketSegments: Segment[];
    onResetToToday: () => void;
    onTrendClick: (phrase: string) => void;
}

export function TicketOverviewSection({
    selectedCompany,
    isSingleDay,
    dateFrom,
    dateTo,
    defaultDateFrom,
    defaultDateTo,
    holidayName,
    ticketStats,
    attendance,
    analytics,
    ticketSegments,
    onResetToToday,
    onTrendClick,
}: TicketOverviewSectionProps) {
    const isFilteredDate = dateFrom !== defaultDateFrom || dateTo !== defaultDateTo;

    return (
        <section className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
                <TicketIcon className="h-5 w-5 text-[#2E7D32]" /> Ticket Overview {selectedCompany && `- ${selectedCompany}`}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 -mt-2 mb-2">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                        {isSingleDay ? `Summary for ${formatDate(dateFrom)}.` : `Summary for ${formatPeriodLabel(dateFrom, dateTo)}.`}
                    </p>
                    {isSingleDay && holidayName && (
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400 font-normal shadow-sm">
                            Hari Libur: {holidayName}
                        </Badge>
                    )}
                </div>
                {isFilteredDate && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetToToday}
                        className="h-6 px-2 text-xs"
                    >
                        Reset to Today
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <Deferred data="ticket_stats" fallback={<><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>}>
                    {ticketStats && (
                        <>
                            <StatCard label="Open Tickets" value={ticketStats.open_total} icon={<Inbox className="h-4 w-4 text-[#2E7D32]" />} accent="bg-green-50 dark:bg-green-950/40" hint="In period" />
                            <StatCard label="Assigned" value={ticketStats.assigned} icon={<TicketIcon className="h-4 w-4 text-[#1B5E20]" />} accent="bg-green-50 dark:bg-green-950/40" />
                            <StatCard label="Pending" value={ticketStats.pending} icon={<PauseCircle className="h-4 w-4 text-[#F9A825]" />} accent="bg-yellow-50 dark:bg-yellow-950/40" />
                            <StatCard label="In Progress" value={ticketStats.in_progress} icon={<Loader2 className="h-4 w-4 text-[#4CAF50]" />} accent="bg-emerald-50 dark:bg-emerald-950/40" />
                            <StatCard label="Completed" value={ticketStats.completed_today} icon={<CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />} accent="bg-green-50 dark:bg-green-950/40" />
                            <StatCard label="Total Tickets" value={ticketStats.created_today} icon={<Sparkles className="h-4 w-4 text-[#FDD835]" />} accent="bg-yellow-50 dark:bg-yellow-950/40" />
                        </>
                    )}
                </Deferred>
            </div>

            <Deferred data={["ticket_stats", "attendance", "analytics"]} fallback={
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-48"></CardContent></Card>
                        <Card className="border-border/60 shadow-sm animate-pulse lg:col-span-2"><CardContent className="h-48"></CardContent></Card>
                    </div>
                    <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-64"></CardContent></Card>
                </div>
            }>
                {ticketStats && attendance && analytics && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <Card className="border-border/60 shadow-sm flex flex-col h-[360px] overflow-hidden">
                                <CardHeader className="pb-0 shrink-0">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Ticket Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col gap-4">
                                    <div className="shrink-0 -mt-2">
                                        <DonutChart segments={ticketSegments} centerLabel="Active" centerValue={ticketStats.open_total} size="sm" />
                                    </div>
                                    <div className="flex-1 w-full min-h-0 relative">
                                        <WorkGroupChart data={analytics.workGroupDistribution} />
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="lg:col-span-2 h-[360px]">
                                <IssueTrendPanel 
                                    trends={analytics.issueTrends} 
                                    dateFrom={dateFrom} 
                                    dateTo={dateTo} 
                                    onItemClick={onTrendClick}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Deferred>
        </section>
    );
}
