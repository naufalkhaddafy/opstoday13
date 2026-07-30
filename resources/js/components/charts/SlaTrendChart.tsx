import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { useState } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface SlaTrendData {
    labels: string[];
    resolutionValues: number[];
    responseValues: number[];
}

interface SlaTrendChartProps {
    data?: {
        week?: SlaTrendData;
        month?: SlaTrendData;
        year?: SlaTrendData;
        thresholds?: {
            response_sla_hours: number;
            resolution_sla_hours: number;
        };
    };
    mode?: 'week' | 'month' | 'year';
    onModeChange?: (mode: 'week' | 'month' | 'year') => void;
    hideFilter?: boolean;
}

export function SlaTrendChart({ data, mode: controlledMode, onModeChange, hideFilter = false }: SlaTrendChartProps) {
    const [internalMode, setInternalMode] = useState<'week' | 'month' | 'year'>('week');
    const mode = controlledMode ?? internalMode;

    const handleModeChange = (newMode: 'week' | 'month' | 'year') => {
        setInternalMode(newMode);
        onModeChange?.(newMode);
    };

    const currentData: SlaTrendData = data?.[mode] ?? {
        labels: [],
        resolutionValues: [],
        responseValues: [],
    };

    const resolutionTarget = data?.thresholds?.resolution_sla_hours ?? 2;
    const responseTarget = data?.thresholds?.response_sla_hours ?? 1;

    const labels = currentData.labels;
    const resolutionValues = currentData.resolutionValues;
    const responseValues = currentData.responseValues;

    const hasData =
        labels.length > 0 &&
        (resolutionValues.some((v) => v > 0) || responseValues.some((v) => v > 0));

    const chartData = {
        labels,
        datasets: [
            {
                type: 'line' as const,
                label: 'Avg Resolution Time',
                data: resolutionValues,
                borderColor: BRAND.dark,
                backgroundColor: 'rgba(27, 94, 32, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: BRAND.dark,
                tension: 0.3,
                fill: false,
                yAxisID: 'y',
                order: 3,
            },
            {
                type: 'line' as const,
                label: 'Avg Response Time',
                data: responseValues,
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#F59E0B',
                tension: 0.3,
                fill: false,
                yAxisID: 'y',
                order: 2,
            },
            {
                type: 'line' as const,
                label: `Resolution Target (${resolutionTarget}h)`,
                data: labels.map(() => resolutionTarget),
                borderColor: '#EF4444',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [6, 4],
                pointRadius: 0,
                pointHoverRadius: 0,
                tension: 0,
                fill: false,
                yAxisID: 'y',
                order: 1,
            },
            {
                type: 'line' as const,
                label: `Response Target (${responseTarget}h)`,
                data: labels.map(() => responseTarget),
                borderColor: '#6366F1',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [4, 4],
                pointRadius: 0,
                pointHoverRadius: 0,
                tension: 0,
                fill: false,
                yAxisID: 'y',
                order: 0,
            },
        ],
    };

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
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
                callbacks: {
                    label: function (context: any) {
                        const label = context.dataset.label || '';
                        const val = context.parsed.y ?? 0;
                        if (val > 0) {
                            const totalMins = Math.round(val * 60);
                            const hrs = Math.floor(totalMins / 60);
                            const mins = totalMins % 60;
                            let minStr = '';
                            if (hrs === 0) {
                                minStr = ` (${totalMins} min${totalMins === 1 ? '' : 's'})`;
                            } else if (mins > 0) {
                                minStr = ` (${hrs}h ${mins}m)`;
                            }
                            return `${label}: ${val} hr(s)${minStr}`;
                        }
                        return `${label}: ${val} hr(s)`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    maxTicksLimit: 12,
                    font: {
                        size: 11,
                    },
                },
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Hours',
                    color: BRAND.dark,
                    font: {
                        size: 11,
                        weight: 'bold',
                    },
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
            y1: {
                display: false,
            },
        },
    };

    return (
        <Card className="border-border/60 shadow-sm flex flex-col h-[360px] overflow-hidden">
            <CardHeader className="pb-2 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-[#1B5E20]" /> Compliance Resolution & Response Trend
                </CardTitle>
                {!hideFilter && (
                    <div className="flex bg-muted/50 rounded-md p-0.5">
                        <button
                            type="button"
                            onClick={() => handleModeChange('week')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                                mode === 'week'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            7 Days (Daily)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('month')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                                mode === 'month'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            This Month (Weekly)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('year')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                                mode === 'year'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            This Year (Monthly)
                        </button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 relative pt-2 pb-4 min-h-0">
                {!hasData ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                        No compliance trend data available in this period.
                    </div>
                ) : (
                    <div className="h-full w-full min-h-0">
                        <Chart type="line" data={chartData} options={options} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
