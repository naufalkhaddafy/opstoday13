import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BRAND_ICON_BOX } from '@/lib/brand';
import {
    UserCircle, CalendarCheck, Clock, AlertTriangle, Ticket,
    CheckCircle2, Timer, CalendarRange, ArrowRight,
    CalendarDays, Stethoscope, FileText
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

type TodayInfo = {
    status: string;
    check_in: string | null;
    check_out: string | null;
    shift: {
        name: string;
        code: string;
        start_time: string;
        end_time: string;
    } | null;
};

type Summary = {
    total_scheduled: number;
    total_present: number;
    total_absent: number;
    total_late_days: number;
    total_late_minutes: number;
    total_cuti: number;
    total_sakit: number;
    total_izin: number;
};

type RecentAttendance = {
    date: string;
    day_name: string;
    shift_name: string;
    shift_time: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
    late_minutes: number;
};

type TicketSummary = {
    total: number;
    closed: number;
    in_progress: number;
    assigned: number;
    pending: number;
};

type EngineerDashboardProps = {
    user: {
        id: number;
        name: string;
        email: string;
        employee_id: string | null;
        company: string | null;
        group: string | null;
    };
    date: string;
    today: TodayInfo;
    summary: Summary;
    recentAttendance: RecentAttendance[];
    tickets: TicketSummary;
};

function getStatusLabel(status: string) {
    const map: Record<string, { label: string; className: string }> = {
        hadir: { label: 'Hadir', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
        tidak_lengkap: { label: 'Tidak Lengkap', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
        scheduled: { label: 'Terjadwal', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
        absen: { label: 'Alpha', className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' },
        tidak_hadir: { label: 'Alpha', className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' },
        cuti: { label: 'Cuti', className: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' },
        sakit: { label: 'Sakit', className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
        izin: { label: 'Izin', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
        off_day: { label: 'Libur', className: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
    };
    return map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

export function EngineerDashboard({ user, date, today, summary, recentAttendance, tickets }: EngineerDashboardProps) {
    const todayStatusInfo = getStatusLabel(today.status);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Greeting Card */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#0d1f12] via-[#1a4a1f] to-[#236b2a] text-white">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-white/60 uppercase tracking-widest">{getGreeting()}</p>
                            <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                                {user.employee_id && <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{user.employee_id}</span>}
                                {user.company && <span>• {user.company}</span>}
                                {user.group && <span>• {user.group}</span>}
                            </div>
                            <p className="text-sm text-white/50 mt-1">{date}</p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                            <Badge className={`text-sm px-3 py-1.5 ${todayStatusInfo.className}`}>
                                {todayStatusInfo.label}
                            </Badge>
                            {today.shift && (
                                <div className="text-sm text-white/70 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span className="font-medium text-white/90">{today.shift.name}</span>
                                    <span>({today.shift.start_time} - {today.shift.end_time})</span>
                                </div>
                            )}
                            {(today.check_in || today.check_out) && (
                                <div className="flex items-center gap-3 text-sm">
                                    {today.check_in && (
                                        <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-emerald-300">
                                            In: {today.check_in}
                                        </span>
                                    )}
                                    {today.check_out && (
                                        <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-amber-300">
                                            Out: {today.check_out}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                        <CalendarCheck className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{summary.total_present}</p>
                        <p className="text-xs text-muted-foreground mt-1">Hadir</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-5 w-5 text-rose-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{summary.total_absent}</p>
                        <p className="text-xs text-muted-foreground mt-1">Alpha</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                        <Timer className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.total_late_days}</p>
                        <p className="text-xs text-muted-foreground mt-1">Terlambat</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                        <CalendarDays className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summary.total_cuti}</p>
                        <p className="text-xs text-muted-foreground mt-1">Cuti</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                        <Stethoscope className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.total_sakit}</p>
                        <p className="text-xs text-muted-foreground mt-1">Sakit</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                        <FileText className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.total_izin}</p>
                        <p className="text-xs text-muted-foreground mt-1">Izin</p>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom section: Recent Attendance + Ticket Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Attendance */}
                <Card className="xl:col-span-2 shadow-sm flex flex-col h-[420px]">
                    <CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className={BRAND_ICON_BOX + ' !p-2'}>
                                <CalendarRange className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Riwayat Kehadiran Terbaru</CardTitle>
                                <CardDescription className="text-xs">7 hari kerja terakhir</CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-xs">
                            <Link href="/attendance">
                                Lihat Semua <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden flex-1 flex flex-col">
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left font-medium">Tanggal</th>
                                        <th className="px-4 py-2.5 text-left font-medium">Shift</th>
                                        <th className="px-4 py-2.5 text-left font-medium">Status</th>
                                        <th className="px-4 py-2.5 text-center font-medium">In / Out</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {recentAttendance.length > 0 ? (
                                        recentAttendance.map((item) => {
                                            const statusInfo = getStatusLabel(item.status);
                                            return (
                                                <tr key={item.date} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{item.day_name}</span>
                                                            <span className="text-xs text-muted-foreground">{item.date}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">{item.shift_name}</span>
                                                            <span className="text-xs text-muted-foreground">{item.shift_time}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <Badge variant="outline" className={statusInfo.className}>
                                                            {statusInfo.label}
                                                        </Badge>
                                                        {item.late_minutes > 0 && (
                                                            <span className="text-[10px] text-rose-500 ml-1">+{item.late_minutes}m</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            {item.check_in ? (
                                                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">In: {item.check_in}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground/50 text-xs">-</span>
                                                            )}
                                                            {item.check_out && (
                                                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Out: {item.check_out}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                Belum ada data kehadiran bulan ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Ticket Summary */}
                <Card className="shadow-sm flex flex-col h-[420px]">
                    <CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className={BRAND_ICON_BOX + ' !p-2'}>
                                <Ticket className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Tiket Saya</CardTitle>
                                <CardDescription className="text-xs">Ringkasan tiket IT</CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-xs">
                            <Link href="/tickets">
                                Lihat Semua <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 flex flex-col gap-4 justify-center">
                        <div className="text-center mb-2">
                            <p className="text-4xl font-bold text-foreground">{tickets.total}</p>
                            <p className="text-sm text-muted-foreground mt-1">Total Tiket</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    <span className="text-xs text-muted-foreground">Assigned</span>
                                </div>
                                <p className="text-lg font-semibold">{tickets.assigned}</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="text-xs text-muted-foreground">In Progress</span>
                                </div>
                                <p className="text-lg font-semibold">{tickets.in_progress}</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="text-xs text-muted-foreground">Pending</span>
                                </div>
                                <p className="text-lg font-semibold">{tickets.pending}</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                    <span className="text-xs text-muted-foreground">Closed</span>
                                </div>
                                <p className="text-lg font-semibold text-emerald-600">{tickets.closed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
