import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface EngineerTrendChartProps {
    data?: Array<{ month: string; tickets: number }>;
    engineerName: string;
}

export function EngineerTrendChart({ data = [], engineerName }: EngineerTrendChartProps) {
    const hasData = data && data.length > 0 && data.some(d => d.tickets > 0);

    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: 'Tickets Closed',
                data: data.map(d => d.tickets),
                backgroundColor: '#34D399', // Emerald-400
                hoverBackgroundColor: '#10B981', // Emerald-500
                borderRadius: 4,
                barThickness: 16,
            }
        ]
    };

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 10,
                callbacks: {
                    label: function(context: any) {
                        return ` ${context.raw} tickets closed`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(156, 163, 175, 0.15)', // Gray-400 with opacity
                },
                ticks: {
                    precision: 0,
                    color: 'rgba(156, 163, 175, 0.8)',
                    font: {
                        size: 10
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'rgba(156, 163, 175, 0.8)',
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#2E7D32]" />
                    Ticket Volume Trend ({engineerName})
                </h4>
            </div>
            
            <div className="flex-1 relative min-h-[140px]">
                {!hasData ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground italic">
                        No closed tickets in the selected period.
                    </div>
                ) : (
                    <div className="absolute inset-0">
                        <Bar options={options} data={chartData} />
                    </div>
                )}
            </div>
        </div>
    );
}
