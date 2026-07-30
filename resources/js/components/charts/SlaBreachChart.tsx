import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { useState } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface SlaTrendData {
    labels: string[];
    metSlaCount?: number[];
    breachedResolutionCount?: number[];
    breachedResponseCount?: number[];
    unresolvedCount?: number[];
}

interface SlaBreachChartProps {
    data?: {
        week?: SlaTrendData;
        month?: SlaTrendData;
        year?: SlaTrendData;
    };
    mode?: 'week' | 'month' | 'year';
    onModeChange?: (mode: 'week' | 'month' | 'year') => void;
    hideFilter?: boolean;
}

export function SlaBreachChart({ data, mode: controlledMode, onModeChange, hideFilter = false }: SlaBreachChartProps) {
    const [internalMode, setInternalMode] = useState<'week' | 'month' | 'year'>('week');
    const mode = controlledMode ?? internalMode;

    const handleModeChange = (newMode: 'week' | 'month' | 'year') => {
        setInternalMode(newMode);
        onModeChange?.(newMode);
    };

    const currentData: SlaTrendData = data?.[mode] ?? {
        labels: [],
        metSlaCount: [],
        breachedResolutionCount: [],
        breachedResponseCount: [],
        unresolvedCount: [],
    };

    const labels = currentData.labels;
    const metCount = currentData.metSlaCount ?? [];
    const breachedResCount = currentData.breachedResolutionCount ?? [];
    const breachedRespCount = currentData.breachedResponseCount ?? [];
    const unresolvedCount = currentData.unresolvedCount ?? [];

    const hasData =
        labels.length > 0 &&
        (metCount.some((v) => v > 0) ||
         breachedResCount.some((v) => v > 0) ||
         breachedRespCount.some((v) => v > 0) ||
         unresolvedCount.some((v) => v > 0));

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Compliant',
                data: metCount,
                backgroundColor: '#10B981', // Emerald 500
                hoverBackgroundColor: '#059669',
                borderRadius: 4,
                stack: 'sla',
            },
            {
                label: 'Exceeded Response Target',
                data: breachedRespCount,
                backgroundColor: '#F59E0B', // Amber 500
                hoverBackgroundColor: '#D97706',
                borderRadius: 4,
                stack: 'sla',
            },
            {
                label: 'Exceeded Resolution Target',
                data: breachedResCount,
                backgroundColor: '#EF4444', // Red 500
                hoverBackgroundColor: '#DC2626',
                borderRadius: 4,
                stack: 'sla',
            },
            {
                label: 'Unresolved (In Progress)',
                data: unresolvedCount,
                backgroundColor: '#3B82F6', // Blue 500
                hoverBackgroundColor: '#2563EB',
                borderRadius: 4,
                stack: 'sla',
            },
        ],
    };

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        size: 11,
                    },
                    maxRotation: 0,
                    autoSkip: true,
                },
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    font: {
                        size: 11,
                    },
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'center',
                labels: {
                    boxWidth: 8,
                    padding: 10,
                    usePointStyle: true,
                    font: {
                        size: 10,
                    },
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context: any) {
                        const label = context.dataset.label || '';
                        const val = context.parsed.y ?? 0;
                        let total = 0;
                        context.chart.data.datasets.forEach((ds: any) => {
                            total += ds.data[context.dataIndex] || 0;
                        });
                        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                        return `${label}: ${val} ticket(s) (${pct}%)`;
                    },
                    footer: function (tooltipItems: any[]) {
                        let total = 0;
                        tooltipItems.forEach((item) => {
                            total += item.parsed.y ?? 0;
                        });
                        return `Total Tickets: ${total}`;
                    },
                },
            },
        },
    };

    return (
        <Card className="border-border/60 shadow-sm flex flex-col h-[360px] overflow-hidden">
            <CardHeader className="pb-2 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                        Compliance Ticket Volume
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Tickets breakdown: Compliant vs Exceeded Target vs Unresolved
                    </p>
                </div>
                {!hideFilter && (
                    <div className="flex bg-muted/50 rounded-md p-0.5 border border-slate-100 dark:border-white/5">
                        {(['week', 'month', 'year'] as const).map((m) => {
                            const label =
                                m === 'week'
                                    ? '7 Days'
                                    : m === 'month'
                                    ? 'This Month'
                                    : 'This Year';
                            return (
                                <button
                                    key={m}
                                    onClick={() => handleModeChange(m)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-all ${
                                        mode === m
                                            ? 'bg-background text-foreground shadow-sm font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 relative pt-2 pb-4 min-h-0">
                <div className="h-full w-full min-h-0">
                    {hasData ? (
                        <Bar data={chartData} options={options} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                            No closed ticket volume data for selected period
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
