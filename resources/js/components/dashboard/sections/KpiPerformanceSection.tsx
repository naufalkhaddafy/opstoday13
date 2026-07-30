import { Deferred } from '@inertiajs/react';
import { ArrowUp } from 'lucide-react';
import { KpiCard, LeaderboardCard } from '@/components/dashboard/MetricCards';
import { StatCardSkeleton } from '@/components/dashboard/Skeletons';
import { SlaTrendChart } from '@/components/charts/SlaTrendChart';
import { SlaBreachChart } from '@/components/charts/SlaBreachChart';
import { formatPeriodLabel } from '@/components/dashboard/helpers';

interface KpiPerformanceSectionProps {
    selectedCompany?: string;
    isSingleDay: boolean;
    dateFrom: string;
    dateTo: string;
    kpiStats?: any;
    engineers?: any[];
    analytics?: any;
    slaMode: 'week' | 'month' | 'year';
    onSlaModeChange: (mode: 'week' | 'month' | 'year') => void;
}

export function KpiPerformanceSection({
    selectedCompany,
    isSingleDay,
    dateFrom,
    dateTo,
    kpiStats,
    engineers,
    analytics,
    slaMode,
    onSlaModeChange,
}: KpiPerformanceSectionProps) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ArrowUp className="h-5 w-5 text-[#2E7D32]" /> Team KPI & Performance {selectedCompany && `- ${selectedCompany}`}
            </h2>
            <p className="-mt-2 text-sm text-muted-foreground">
                Global performance metrics and Compliance for {isSingleDay ? 'the selected date' : formatPeriodLabel(dateFrom, dateTo)}.
            </p>
            <Deferred data={["kpi_stats", "engineers", "analytics"]} fallback={
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                    </div>
                </div>
            }>
                {kpiStats && engineers && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <KpiCard
                                    title="Response Compliance"
                                    value={kpiStats.current.response_sla_percent}
                                    isPercentage
                                    trendCurrent={kpiStats.current.response_sla_percent}
                                    trendPrevious={kpiStats.previous.response_sla_percent}
                                    subtitle={`Target: < ${kpiStats.targets.response_sla_seconds / 3600} hours`}
                                />
                                <KpiCard
                                    title="Resolution Compliance"
                                    value={kpiStats.current.resolution_sla_percent}
                                    isPercentage
                                    trendCurrent={kpiStats.current.resolution_sla_percent}
                                    trendPrevious={kpiStats.previous.resolution_sla_percent}
                                    subtitle={`Target: < ${kpiStats.targets.resolution_sla_hours} hours`}
                                />
                                <KpiCard
                                    title="Avg Response"
                                    value={kpiStats.current.avg_response_label ?? '-'}
                                    trendCurrent={kpiStats.current.avg_response_seconds}
                                    trendPrevious={kpiStats.previous.avg_response_seconds}
                                    inverse
                                    subtitle="Global average"
                                />
                                <KpiCard
                                    title="Avg Resolution"
                                    value={kpiStats.current.avg_resolution_label ?? '-'}
                                    trendCurrent={kpiStats.current.avg_resolution_hours}
                                    trendPrevious={kpiStats.previous.avg_resolution_hours}
                                    inverse
                                    subtitle="Global average"
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <LeaderboardCard engineers={engineers} />
                            </div>
                        </div>
                        {analytics?.slaTrend && (
                            <div className="flex flex-col gap-3 pt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20 border border-slate-100 dark:border-white/5 rounded-lg px-4 py-2.5">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            Compliance Trend & Breakdown
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Unified analysis of response/resolution times and compliance ticket volume
                                        </p>
                                    </div>
                                    <div className="flex bg-muted/60 rounded-md p-0.5 border border-slate-200 dark:border-white/10 self-start sm:self-auto">
                                        {(['week', 'month', 'year'] as const).map((m) => {
                                            const label =
                                                m === 'week'
                                                    ? '7 Days (Daily)'
                                                    : m === 'month'
                                                    ? 'This Month (Weekly)'
                                                    : 'This Year (Monthly)';
                                            return (
                                                <button
                                                    key={m}
                                                    onClick={() => onSlaModeChange(m)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                                                        slaMode === m
                                                            ? 'bg-background text-foreground shadow-sm font-semibold'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <SlaTrendChart data={analytics.slaTrend} mode={slaMode} hideFilter />
                                    <SlaBreachChart data={analytics.slaTrend} mode={slaMode} hideFilter />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Deferred>
        </section>
    );
}
