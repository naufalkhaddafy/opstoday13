import React from 'react';
import { Segment } from '@/types/dashboard';

export function DonutChart({ segments, centerLabel, centerValue }: { segments: Segment[]; centerLabel: string; centerValue: number }) {
    if (centerValue === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No data available
            </div>
        );
    }

    const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
    let currentOffset = 0;

    return (
        <div className="flex h-48 items-center gap-6">
            <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 100 100" className="-rotate-90 transform">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="16" className="text-muted/20" />
                    {segments.map((segment) => {
                        if (segment.value === 0) return null;
                        const percentage = (segment.value / total) * 100;
                        const circumference = 2 * Math.PI * 40;
                        const strokeDasharray = `${(percentage * circumference) / 100} ${circumference}`;
                        const strokeDashoffset = -((currentOffset * circumference) / 100);
                        currentOffset += percentage;

                        return (
                            <circle
                                key={segment.label}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                strokeWidth="16"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500 ease-in-out"
                                style={{ stroke: segment.color }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{centerValue}</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{centerLabel}</span>
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-3">
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
