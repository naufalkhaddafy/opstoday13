import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket as TicketIcon, Clock, CheckCircle2, Loader2, PauseCircle, Timer } from 'lucide-react';

type Summary = {
    total: number;
    open: number;
    in_progress: number;
    pending: number;
    closed: number;
    avg_response_time_seconds: number | null;
    avg_response_time_label: string | null;
    avg_resolution_time_hours: number | null;
    avg_resolution_time_label: string | null;
    resolved_count: number;
};

export function TicketsSummaryCards({ summary }: { summary: Summary }) {
    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <SummaryCard label="Total Tiket" value={summary.total} icon={<TicketIcon className="h-4 w-4" />} />
                <SummaryCard label="Assigned" value={summary.open} icon={<Clock className="h-4 w-4" />} />
                <SummaryCard label="In Progress" value={summary.in_progress} icon={<Loader2 className="h-4 w-4" />} />
                <SummaryCard label="Pending" value={summary.pending} icon={<PauseCircle className="h-4 w-4" />} />
                <SummaryCard label="Closed" value={summary.closed} icon={<CheckCircle2 className="h-4 w-4" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Timer className="h-4 w-4" /> Rata-rata Response Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold tracking-tight">
                            {summary.avg_response_time_label ?? 'Belum ada data'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Dari created sampai status In Progress</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Rata-rata Resolution Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold tracking-tight">
                            {summary.avg_resolution_time_label ?? 'Belum ada data'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Waktu penyelesaian resmi dari {summary.resolved_count} tiket selesai
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <Card className="shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    {icon}
                    {label}
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            </CardContent>
        </Card>
    );
}
