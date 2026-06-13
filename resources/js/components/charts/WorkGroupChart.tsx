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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface WorkGroupChartProps {
    data: { name: string; total: number }[];
}

export function WorkGroupChart({ data }: WorkGroupChartProps) {
    const labels = data.map(d => d.name || 'Unassigned');
    const values = data.map(d => d.total);

    const hasData = values.some(v => v > 0);

    const backgroundColors = [
        'rgba(46, 125, 50, 0.8)',   // green
        'rgba(245, 158, 11, 0.8)',  // amber
        'rgba(59, 130, 246, 0.8)',  // blue
        'rgba(239, 68, 68, 0.8)',   // red
        'rgba(168, 85, 247, 0.8)',  // purple
        'rgba(14, 165, 233, 0.8)',  // sky
        'rgba(249, 115, 22, 0.8)',  // orange
        'rgba(16, 185, 129, 0.8)',  // emerald
        'rgba(236, 72, 153, 0.8)',  // pink
        'rgba(99, 102, 241, 0.8)',  // indigo
    ];

    const borderColors = [
        'rgb(46, 125, 50)',
        'rgb(245, 158, 11)',
        'rgb(59, 130, 246)',
        'rgb(239, 68, 68)',
        'rgb(168, 85, 247)',
        'rgb(14, 165, 233)',
        'rgb(249, 115, 22)',
        'rgb(16, 185, 129)',
        'rgb(236, 72, 153)',
        'rgb(99, 102, 241)',
    ];

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Tickets',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4,
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
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#000',
                bodyColor: '#000',
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function (context: any) {
                        return `${context.parsed.y} Tickets`;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    color: 'rgba(0,0,0,0.5)',
                    font: {
                        size: 10,
                    }
                },
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                },
                border: {
                    display: false,
                }
            },
            x: {
                ticks: {
                    color: 'rgba(0,0,0,0.5)',
                    font: {
                        size: 8,
                    },
                    maxRotation: 0,
                    minRotation: 0,
                    autoSkip: false,
                },
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                }
            },
        },
    };

    if (!hasData) {
        return (
            <div className="flex h-full min-h-[140px] w-full items-center justify-center text-sm text-muted-foreground border-t mt-4 pt-4">
                No work group data available.
            </div>
        );
    }

    return (
        <div className="h-full w-full border-t pt-4 relative min-h-0">
            <Bar data={chartData} options={options} />
        </div>
    );
}
