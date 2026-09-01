import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Clock } from 'lucide-react';

interface PoolPerformanceEntry {
    pool_name: string;
    total_dispatched: number;
    avg_dispatch_seconds: number;
}

interface PoolPerformanceCardProps {
    data: PoolPerformanceEntry[];
}

export function PoolPerformanceCard({ data }: PoolPerformanceCardProps) {
    const formatMinutes = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const m = Math.round(seconds / 60);
        if (m >= 60) {
            const h = Math.floor(m / 60);
            const rem = m % 60;
            return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
        }
        return `${m}m`;
    };

    return (
        <Card className="border-border/60 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20 shrink-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    Pool SLA
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                        <Clock className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">No dispatch data yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {data.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 sm:px-4 hover:bg-muted/30 transition-colors">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-sm font-medium truncate pr-2">
                                        {item.pool_name.replace('Pool ', '')}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {item.total_dispatched} tickets dispatched
                                    </span>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                    <div className="text-sm font-bold text-foreground">
                                        {formatMinutes(item.avg_dispatch_seconds)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Avg Wait
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
