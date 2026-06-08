import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import { EngineerSummary } from '@/types/dashboard';

export function StatCard({
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

export function TrendIndicator({ current, previous, inverse = false }: { current: number | null; previous: number | null; inverse?: boolean }) {
    if (current === null || previous === null || previous === 0) return null;
    
    const diff = current - previous;
    if (diff === 0) return <span className="text-[10px] text-muted-foreground ml-2">No change</span>;

    const percent = Math.abs((diff / previous) * 100).toFixed(1);
    
    // For times, lower is better (inverse = true)
    // For percent/SLA, higher is better (inverse = false)
    const isGood = inverse ? diff < 0 : diff > 0;
    
    return (
        <span className={`text-[10px] font-medium ml-2 flex items-center gap-0.5 ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {percent}% vs prev
        </span>
    );
}

export function KpiCard({
    title,
    value,
    trendCurrent,
    trendPrevious,
    inverse = false,
    subtitle,
    isPercentage = false,
    target = null,
}: {
    title: string;
    value: string | number | null;
    trendCurrent: number | null;
    trendPrevious: number | null;
    inverse?: boolean;
    subtitle?: string;
    isPercentage?: boolean;
    target?: number | null;
}) {
    let colorClass = "text-foreground";
    let progressColor = "bg-primary";
    
    if (isPercentage && typeof value === 'number') {
        if (value >= 90) { colorClass = "text-emerald-600 dark:text-emerald-400"; progressColor = "bg-emerald-500"; }
        else if (value >= 75) { colorClass = "text-yellow-600 dark:text-yellow-500"; progressColor = "bg-yellow-500"; }
        else { colorClass = "text-rose-600 dark:text-rose-500"; progressColor = "bg-rose-500"; }
    }

    return (
        <Card className="border-border/60 shadow-sm relative overflow-hidden">
            <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold tracking-tight ${colorClass}`}>
                        {value !== null ? value : '-'}
                        {isPercentage && value !== null ? '%' : ''}
                    </span>
                    <TrendIndicator current={trendCurrent} previous={trendPrevious} inverse={inverse} />
                </div>
                {subtitle && <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>}
                
                {isPercentage && typeof value === 'number' && (
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${progressColor} transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function LeaderboardCard({ engineers }: { engineers: EngineerSummary[] }) {
    // Sort engineers by completed tickets in this period
    const topPerformers = [...engineers]
        .sort((a, b) => b.completed_today - a.completed_today)
        .slice(0, 3); // Top 3

    return (
        <Card className="border-border/60 shadow-sm relative overflow-hidden flex flex-col h-full">
            <CardContent className="p-5 flex-1 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" /> Top Performers
                </p>
                {topPerformers.length > 0 ? (
                    <div className="space-y-4 flex-1">
                        {topPerformers.map((engineer, idx) => {
                            const initials = engineer.name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
                            const medals = ['text-amber-400', 'text-slate-300', 'text-amber-600'];
                            
                            return (
                                <div key={engineer.id} className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-xs font-semibold text-foreground">
                                            {initials}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border shadow-sm text-[9px] font-bold ${medals[idx]}`}>
                                            {idx + 1}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">{engineer.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{engineer.completed_today} tickets resolved</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                        No tickets resolved yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
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
