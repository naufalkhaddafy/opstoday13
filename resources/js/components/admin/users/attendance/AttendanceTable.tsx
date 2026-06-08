import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Shift = {
    id: number;
    code: string;
    name: string;
    start_time: string;
    end_time: string;
};

type AttendanceLog = {
    date: string;
    day_of_week: number;
    day_number: number;
    shift: Shift | null;
    check_in_at: string | null;
    check_out_at: string | null;
    presence_status: 'hadir' | 'tidak_lengkap' | 'absen' | 'tidak_hadir' | 'scheduled' | 'off_day';
    timing_status: 'on_time' | 'late' | 'early_leave' | 'overtime' | 'mixed' | null;
    late_minutes: number;
    early_leave_minutes: number;
    overtime_minutes: number;
};

type AttendanceTableProps = {
    logs: AttendanceLog[];
    currentMonthName: string;
    isLoading: boolean;
};

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const formatTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '-';
    const parts = dateTimeString.split(' ');
    if (parts.length < 2) return '-';
    return parts[1].substring(0, 5); // Return HH:MM
};

const isToday = (dateString: string) => {
    const todayStr = new Date().toLocaleDateString('sv');
    return dateString === todayStr;
};

const getPresenceBadge = (status: string) => {
    switch (status) {
        case 'hadir':
            return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 font-normal">Hadir</Badge>;
        case 'tidak_lengkap':
            return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 font-normal">Incomplete</Badge>;
        case 'absen':
        case 'tidak_hadir':
            return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 font-normal">Alpha</Badge>;
        case 'cuti':
            return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 font-normal">Cuti</Badge>;
        case 'sakit':
            return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 font-normal">Sakit</Badge>;
        case 'izin':
            return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-normal">Izin</Badge>;
        case 'scheduled':
            return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 dark:text-blue-300 dark:border-blue-900/50 dark:bg-blue-950/20 font-normal">Terjadwal</Badge>;
        case 'off_day':
            return <Badge variant="secondary" className="text-muted-foreground bg-muted/50 dark:bg-muted/20 font-normal">Libur</Badge>;
        default:
            return <Badge variant="outline" className="font-normal">{status}</Badge>;
    }
};

const getTimingDetails = (log: AttendanceLog) => {
    const details = [];
    if (log.presence_status === 'hadir' || log.presence_status === 'tidak_lengkap') {
        if (log.late_minutes > 0) {
            details.push(
                <span key="late" className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    Terlambat {log.late_minutes}m
                </span>
            );
        }

        if (!log.check_out_at) {
            if (isToday(log.date)) {
                details.push(
                    <span key="working" className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Sedang Bekerja
                    </span>
                );
            }
        } else {
            if (log.early_leave_minutes > 0) {
                details.push(
                    <span key="early" className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Short by {log.early_leave_minutes}m
                    </span>
                );
            }
            if (log.overtime_minutes > 0) {
                details.push(
                    <span key="overtime" className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Extended Time by {log.overtime_minutes}m
                    </span>
                );
            }

            if (log.early_leave_minutes === 0 && log.overtime_minutes === 0) {
                details.push(
                    <span key="perfect" className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Perfect Work
                    </span>
                );
            }
        }
    }

    return <div className="flex flex-col gap-0.5">{details}</div>;
};

export function AttendanceTable({ logs, currentMonthName, isLoading }: AttendanceTableProps) {
    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle>Riwayat Absensi Harian</CardTitle>
                <CardDescription>Rincian data perekaman tap fingerprint karyawan sepanjang bulan {currentMonthName}.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/50 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                            <tr className="border-b">
                                <th className="px-4 py-3.5 text-center w-12">No</th>
                                <th className="px-4 py-3.5 min-w-[120px]">Hari & Tanggal</th>
                                <th className="px-4 py-3.5 min-w-[140px]">Shift Kerja</th>
                                <th className="px-4 py-3.5 text-center min-w-[80px]">Clock In</th>
                                <th className="px-4 py-3.5 text-center min-w-[80px]">Clock Out</th>
                                <th className="px-4 py-3.5 text-center min-w-[100px]">Status</th>
                                <th className="px-4 py-3.5 min-w-[140px]">Detail Timing</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isLoading ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
                            {logs.length > 0 ? (
                                logs.map((log) => {
                                    const today = isToday(log.date);
                                    const isWeekend = log.day_of_week === 6 || log.day_of_week === 7;

                                    let rowBg = '';
                                    if (today) {
                                        rowBg = 'bg-indigo-50/30 dark:bg-indigo-950/10 font-medium border-l-2 border-l-indigo-500';
                                    } else if (isWeekend && log.presence_status === 'off_day') {
                                        rowBg = 'bg-muted/20 text-muted-foreground/80';
                                    }

                                    return (
                                        <tr
                                            key={log.date}
                                            className={`hover:bg-muted/30 transition-colors ${rowBg}`}
                                        >
                                            <td className="px-4 py-3.5 text-center text-muted-foreground/60">{log.day_number}</td>
                                            <td className="px-4 py-3.5 font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">{DAY_NAMES[log.day_of_week]}</span>
                                                    <span className="text-[11px] text-muted-foreground font-normal">{log.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {log.shift ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground font-normal">{log.shift.name}</span>
                                                        <span className="text-[11px] text-muted-foreground">({log.shift.start_time} - {log.shift.end_time})</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/60 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono text-xs">
                                                {formatTime(log.check_in_at)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono text-xs">
                                                {formatTime(log.check_out_at)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {log.check_in_at && !log.check_out_at && isToday(log.date) ? (
                                                    <Badge className="bg-blue-500 text-white font-normal hover:bg-blue-600">On Duty</Badge>
                                                ) : getPresenceBadge(log.presence_status)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {getTimingDetails(log)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="h-32 text-center text-muted-foreground">
                                        Tidak ada data absensi untuk periode ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
