import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, CalendarClock } from 'lucide-react';
import { useMemo } from 'react';

type Summary = {
    total_scheduled: number;
    total_present: number;
    total_incomplete: number;
    total_absent: number;
    total_late_days: number;
    total_late_minutes: number;
    total_early_leave_days: number;
    total_early_leave_minutes: number;
    total_overtime_days: number;
    total_overtime_minutes: number;
    total_off_days: number;
    total_cuti: number;
    total_sakit: number;
    total_izin: number;
};

type AttendanceSummaryCardsProps = {
    summary: Summary;
};

export function AttendanceSummaryCards({ summary }: AttendanceSummaryCardsProps) {
    const presenceRate = useMemo(() => {
        if (summary.total_scheduled === 0) return 0;
        return Math.round((summary.total_present / summary.total_scheduled) * 100);
    }, [summary]);

    const averageLateMinutes = summary.total_late_days > 0
        ? Math.round(summary.total_late_minutes / summary.total_late_days)
        : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Rate Kehadiran & Alpha */}
            <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                        Kehadiran Bulan Ini <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">{presenceRate}%</span>
                        <span className="text-xs text-muted-foreground">({summary.total_present} / {summary.total_scheduled} Hari)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-3 mb-2 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${presenceRate}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between font-medium">
                        <span>Tidak Hadir (Alpha):</span>
                        <span className={`font-bold ${summary.total_absent > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {summary.total_absent} Hari
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Keterlambatan */}
            <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                        Frekuensi Terlambat <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">{summary.total_late_days}</span>
                        <span className="text-xs text-muted-foreground">Hari</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1 font-medium">
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Total Akumulasi: {summary.total_late_minutes} menit
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                            Rata-rata: {averageLateMinutes} menit/hari
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Kurang Waktu / Short By */}
            <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                        Kurang Waktu (Short By) <TrendingDown className="h-3.5 w-3.5 text-blue-500" />
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">{summary.total_early_leave_days}</span>
                        <span className="text-xs text-muted-foreground font-medium">Hari</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1 font-medium">
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Total Akumulasi: {summary.total_early_leave_minutes} menit
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                            Lupa Absen Out/In: {summary.total_incomplete} Hari
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lembur / Extended Time */}
            <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                        Lembur (Extended Time) <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">{summary.total_overtime_days}</span>
                        <span className="text-xs text-muted-foreground font-medium">Hari</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1 font-medium">
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            Total Akumulasi: {summary.total_overtime_minutes} menit
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cuti / Izin / Sakit */}
            <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                        Cuti / Sakit / Izin <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">{summary.total_cuti + summary.total_sakit + summary.total_izin}</span>
                        <span className="text-xs text-muted-foreground font-medium">Hari</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-2 flex flex-col gap-0.5 font-medium">
                        <div className="flex justify-between"><span>Cuti:</span> <span>{summary.total_cuti}</span></div>
                        <div className="flex justify-between"><span>Sakit:</span> <span>{summary.total_sakit}</span></div>
                        <div className="flex justify-between"><span>Izin:</span> <span>{summary.total_izin}</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
