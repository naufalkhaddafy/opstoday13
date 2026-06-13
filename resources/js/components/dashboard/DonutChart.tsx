import React, { useMemo } from 'react';
import { Segment } from '@/types/dashboard';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export function DonutChart({ segments, centerLabel, centerValue, size = 'normal' }: { segments: Segment[]; centerLabel: string; centerValue: number; size?: 'sm' | 'normal' }) {
    if (centerValue === 0) {
        return (
            <div className={`flex ${size === 'sm' ? 'h-24' : 'h-36'} items-center justify-center text-sm text-muted-foreground`}>
                No data available
            </div>
        );
    }

    const data = useMemo(() => {
        // filter out zero values
        const validSegments = segments.filter(s => s.value > 0);
        return {
            labels: validSegments.map(s => s.label),
            datasets: [
                {
                    data: validSegments.map(s => s.value),
                    backgroundColor: validSegments.map(s => s.color),
                    borderWidth: 0,
                    hoverOffset: 4,
                },
            ],
        };
    }, [segments]);

    const options = {
        cutout: '75%',
        plugins: {
            legend: {
                display: false, // We use custom legend
            },
            tooltip: {
                enabled: true,
                padding: 12,
                titleFont: { size: 13, family: "'Instrument Sans', sans-serif" },
                bodyFont: { size: 12, family: "'Instrument Sans', sans-serif" },
                cornerRadius: 8,
            },
        },
        maintainAspectRatio: false,
    };

    const containerHeight = size === 'sm' ? 'h-24' : 'h-36';
    const chartSize = size === 'sm' ? 'h-24 w-24' : 'h-32 w-32';
    const centerTextSize = size === 'sm' ? 'text-xl' : 'text-2xl';

    return (
        <div className={`flex ${containerHeight} items-center gap-4`}>
            <div className={`relative ${chartSize} shrink-0`}>
                <Doughnut data={data} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className={`${centerTextSize} font-bold text-foreground`}>{centerValue}</span>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{centerLabel}</span>
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-2">
                {segments.map((segment) => {
                    if (segment.value === 0) return null;
                    return (
                        <div key={segment.label} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                                <span className="text-xs text-muted-foreground">{segment.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-foreground">{segment.value}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
