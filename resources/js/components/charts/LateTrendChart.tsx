import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { formatDate } from '@/components/dashboard/helpers';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface LateTrendChartProps {
    data: Record<string, number>;
}

export function LateTrendChart({ data }: LateTrendChartProps) {
    const dates = Object.keys(data);
    const labels = dates.map(date => formatDate(date));
    const values = Object.values(data);

    const hasData = values.some(v => v > 0);

    const chartData = {
        labels,
        datasets: [
            {
                fill: true,
                label: 'Total Late Minutes',
                data: values,
                borderColor: '#F59E0B', // amber-500
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#F59E0B',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `${context.parsed.y} minutes`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    maxTicksLimit: 10,
                }
            },
        },
    };

    return (
        <Card className="border-border/60 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-amber-500" /> Late Minutes Trend
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 relative">
                {!hasData ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                        No late minutes recorded in this period. Great job! 🎉
                    </div>
                ) : (
                    <Line options={options} data={chartData} />
                )}
            </CardContent>
        </Card>
    );
}
