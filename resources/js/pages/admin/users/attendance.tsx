import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import {
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    CalendarClock,
    Coffee,
    ArrowLeft,
    User as UserIcon,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { useMemo } from 'react';

type User = {
    id: number;
    name: string;
    email: string;
    employee_id: string | null;
};

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

type Summary = {
    total_scheduled: number;
    total_present: number;
    total_incomplete: number;
    total_absent: number;
    total_late_days: number;
    total_late_minutes: number;
    total_early_leave_days: number;
    total_early_leave_minutes: number;
    total_off_days: number;
    total_cuti: number;
    total_sakit: number;
    total_izin: number;
};

type CurrentShift = {
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    days: number[];
} | null;

type AttendanceProps = {
    user: User;
    attendance_logs: AttendanceLog[];
    summary: Summary;
    current_shift: CurrentShift;
    filters: {
        month: number;
        year: number;
    };
};

const MONTH_NAMES = [
    { value: 1, name: 'Januari' },
    { value: 2, name: 'Februari' },
    { value: 3, name: 'Maret' },
    { value: 4, name: 'April' },
    { value: 5, name: 'Mei' },
    { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' },
    { value: 8, name: 'Agustus' },
    { value: 9, name: 'September' },
    { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' },
    { value: 12, name: 'Desember' }
];

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function UserAttendance({ user, attendance_logs, summary, current_shift, filters }: AttendanceProps) {

    // Generate years for filter (current year - 2 to current year + 1)
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear - 2; y <= currentYear + 1; y++) {
            years.push(y);
        }
        return years;
    }, []);

    const handleFilterChange = (key: 'month' | 'year', value: string) => {
        const newFilters = {
            ...filters,
            [key]: parseInt(value, 10),
        };

        router.get(UserController.attendance({ user: user.id }).url, newFilters, { preserveState: true, preserveScroll: true });
    };

    const handlePrevMonth = () => {
        let newMonth = filters.month - 1;
        let newYear = filters.year;
        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }
        router.get(UserController.attendance({ user: user.id }).url, { month: newMonth, year: newYear }, { preserveState: true, preserveScroll: true });
    };

    const handleNextMonth = () => {
        let newMonth = filters.month + 1;
        let newYear = filters.year;
        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }
        router.get(UserController.attendance({ user: user.id }).url, { month: newMonth, year: newYear }, { preserveState: true, preserveScroll: true });
    };

    const formatTime = (dateTimeString: string | null) => {
        if (!dateTimeString) return '-';
        const parts = dateTimeString.split(' ');
        if (parts.length < 2) return '-';
        return parts[1].substring(0, 5); // Return HH:MM
    };

    const isToday = (dateString: string) => {
        const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD
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

    const formatShiftDays = (days: number[] | null) => {
        if (!days || days.length === 0) return 'Semua Hari';
        if (days.length === 7) return 'Setiap Hari';

        const dayNamesShort = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const sortedDays = [...days].sort((a, b) => a - b);

        const isConsecutive = sortedDays.every((d, i) => i === 0 || d === sortedDays[i - 1] + 1);
        if (isConsecutive && sortedDays.length > 2) {
            return `${dayNamesShort[sortedDays[0] - 1]} - ${dayNamesShort[sortedDays[sortedDays.length - 1] - 1]}`;
        }

        return sortedDays.map(d => dayNamesShort[d - 1]).join(', ');
    };

    const currentMonthName = useMemo(() => {
        return MONTH_NAMES.find(m => m.value === filters.month)?.name || '';
    }, [filters.month]);

    const presenceRate = useMemo(() => {
        if (summary.total_scheduled === 0) return 0;
        return Math.round((summary.total_present / summary.total_scheduled) * 100);
    }, [summary]);

    const averageLateMinutes = summary.total_late_days > 0
        ? Math.round(summary.total_late_minutes / summary.total_late_days)
        : 0;

    return (
        <>
            <Head title={`Detail Kehadiran: ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-7xl mx-auto w-full">

                {/* Upper Section: User details & Current Shift Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col justify-between p-6 rounded-xl border bg-card text-card-foreground shadow-sm bg-gradient-to-br from-indigo-50/40 via-transparent to-transparent dark:from-indigo-950/10">
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <UserIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                            <span>{user.email}</span>
                                            {user.employee_id && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-border"></span>
                                                    <span>ID: {user.employee_id}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" asChild className="shrink-0 w-full sm:w-auto">
                                    <Link href={UserController.index().url}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-4 sm:gap-12">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Periode Laporan</p>
                                <p className="text-base font-semibold">{currentMonthName} {filters.year}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Hari Kerja</p>
                                <p className="text-base font-semibold">{summary.total_scheduled} Hari</p>
                            </div>
                        </div>
                    </div>

                    {/* Current Shift Card */}
                    <Card className="shadow-sm bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Shift Aktif Hari Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {current_shift ? (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-bold tracking-tight">{current_shift.name}</h3>
                                        <Badge variant="secondary" className="mt-1 font-mono">{current_shift.code}</Badge>
                                    </div>

                                    <div className="space-y-3 pt-3 border-t border-border/50">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" /> Jam Kerja
                                            </span>
                                            <span className="font-medium">{current_shift.start_time} - {current_shift.end_time}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5 text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" /> Jadwal Mingguan
                                            </span>
                                            <span className="font-medium bg-muted/50 p-2 rounded-md text-center">
                                                {formatShiftDays(current_shift.days)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-muted-foreground text-center">
                                    <Coffee className="h-8 w-8 mb-2 text-muted-foreground/60" />
                                    <span className="text-sm">Belum memiliki shift yang aktif</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Navigation Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevMonth} title="Bulan Sebelumnya">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-lg font-semibold text-center min-w-[160px] text-foreground">
                            {currentMonthName} {filters.year}
                        </h2>
                        <Button variant="outline" size="icon" onClick={handleNextMonth} title="Bulan Berikutnya">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={filters.month.toString()}
                            onValueChange={(val) => handleFilterChange('month', val)}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_NAMES.map((m) => (
                                    <SelectItem key={m.value} value={m.value.toString()}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.year.toString()}
                            onValueChange={(val) => handleFilterChange('year', val)}
                        >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Monthly Summary Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Rate Kehadiran */}
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
                            <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${presenceRate}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Mangkir / Alpha */}
                    <Card className="hover:border-foreground/20 transition-colors">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                                Tidak Hadir (Alpha) <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{summary.total_absent}</span>
                                <span className="text-xs text-muted-foreground">Hari Kerja</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1 font-medium">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${summary.total_absent > 0 ? 'bg-rose-500' : 'bg-muted-foreground/30'}`}></span>
                                {summary.total_absent > 0 ? 'Absen tanpa keterangan' : 'Karyawan nihil Alpha bulan ini!'}
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

                {/* Table Section */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Riwayat Absensi Harian</CardTitle>
                        <CardDescription>Rincian data perekaman tap fingerprint karyawan sepanjang bulan {currentMonthName}.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        <div className="overflow-x-auto">
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
                                <tbody className="divide-y">
                                    {attendance_logs.length > 0 ? (
                                        attendance_logs.map((log) => {
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
            </div>
        </>
    );
}

UserAttendance.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen User',
            href: UserController.index().url,
        },
        {
            title: 'Detail Kehadiran',
            href: '#',
        },
    ],
};
