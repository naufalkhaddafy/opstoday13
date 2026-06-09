import { Head, Link } from '@inertiajs/react';
import { EngineerDashboard } from '@/components/dashboard/engineer-dashboard';
import { dashboard } from '@/routes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, CalendarClock, Activity, Ticket, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BRAND_ICON_BOX } from '@/lib/brand';

type Stats = {
    total_users: number;
    total_scheduled: number;
    total_present: number;
    total_leave: number;
    total_absent: number;
    total_late: number;
    total_early_leave: number;
};

type EmployeeStatus = {
    id: number;
    name: string;
    shift_name: string;
    shift_time: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
    late_minutes: number;
    leave_description: string | null;
};

type DashboardProps = {
    view: 'admin' | 'engineer';
    // Admin props
    stats?: Stats;
    employeeStatuses?: EmployeeStatus[];
    date?: string;
    // Engineer props
    user?: any;
    today?: any;
    summary?: any;
    recentAttendance?: any[];
    tickets?: any;
};

function getStatusBadge(status: string) {
    switch (status) {
        case 'hadir':
        case 'tidak_lengkap':
            return <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100/80 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">Hadir</Badge>;
        case 'sakit':
        case 'izin':
        case 'cuti':
            return <Badge className="border-yellow-200 bg-yellow-50 capitalize text-yellow-800 hover:bg-yellow-50/80 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{status}</Badge>;
        case 'absen':
        case 'tidak_hadir':
            return <Badge className="border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-100/80 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">Alpha</Badge>;
        case 'off_day':
        default:
            return <Badge variant="outline" className="bg-muted/50 text-muted-foreground">Libur</Badge>;
    }
}

export default function Dashboard(props: DashboardProps) {
    if (props.view === 'engineer') {
        return (
            <>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto">
                    <EngineerDashboard
                        user={props.user!}
                        date={props.date!}
                        today={props.today!}
                        summary={props.summary!}
                        recentAttendance={props.recentAttendance!}
                        tickets={props.tickets!}
                    />
                </div>
            </>
        );
    }

    // Admin / SPV view
    const { stats, employeeStatuses, date, tickets } = props as Required<Pick<DashboardProps, 'stats' | 'employeeStatuses' | 'date' | 'tickets'>>;

    const attendanceRate = stats.total_scheduled > 0
        ? Math.round((stats.total_present / stats.total_scheduled) * 100)
        : 0;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto">
                {/* Hero Header */}
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#0d1f12] via-[#1a4a1f] to-[#236b2a] text-white mx-4 mt-4 md:mx-6 md:mt-6 lg:mx-8 lg:mt-8 max-w-7xl xl:mx-auto xl:w-full">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                                <span className="inline-block rounded-full bg-[#FDD835]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#FDD835]">
                                    Admin Dashboard
                                </span>
                                <h1 className="text-2xl md:text-3xl font-bold">Ringkasan Hari Ini</h1>
                                <p className="text-sm text-white/60">{date}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-white/60">Tingkat Kehadiran</p>
                                    <p className="text-3xl font-bold text-[#FDD835]">{attendanceRate}%</p>
                                </div>
                                <div className="h-16 w-16 rounded-full border-4 border-[#FDD835]/30 flex items-center justify-center">
                                    <UserCheck className="h-7 w-7 text-[#FDD835]" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6 px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8 max-w-7xl mx-auto w-full">
                    {/* KPI Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-[#2E7D32]">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">Total Terjadwal</p>
                                        <p className="text-3xl font-bold mt-1">{stats.total_scheduled}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Dari {stats.total_users} karyawan
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
                                        <Users className="h-5 w-5 text-[#2E7D32]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all border-l-4 border-l-emerald-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">Hadir</p>
                                        <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.total_present}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Sudah check-in
                                        </p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                                        <UserCheck className="h-5 w-5 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all border-l-4 border-l-rose-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">Belum Hadir</p>
                                        <p className="text-3xl font-bold mt-1 text-rose-600 dark:text-rose-400">{stats.total_absent}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Belum tap in
                                        </p>
                                    </div>
                                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                                        <UserX className="h-5 w-5 text-rose-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all border-l-4 border-l-amber-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">Terlambat</p>
                                        <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.total_late}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Lewat jam masuk
                                        </p>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance table */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <Card className="shadow-sm xl:col-span-2 flex flex-col h-[500px]">
                            <CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-[#2E7D32]" />
                                    Daftar Kehadiran Karyawan
                                </CardTitle>
                                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800/50">
                                    <CalendarClock className="h-4 w-4 text-[#2E7D32]" />
                                    <span className="text-xs font-medium text-green-800 dark:text-green-300">{stats.total_leave} Cuti / Izin</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 overflow-hidden flex-1 flex flex-col">
                                <div className="overflow-x-auto overflow-y-auto flex-1">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 border-b sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Nama Karyawan</th>
                                                <th className="px-4 py-3 font-medium">Jadwal Shift</th>
                                                <th className="px-4 py-3 font-medium">Status</th>
                                                <th className="px-4 py-3 font-medium text-center">In / Out</th>
                                                <th className="px-4 py-3 font-medium">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {employeeStatuses.length > 0 ? (
                                                employeeStatuses.map((emp) => (
                                                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-2 font-medium text-foreground">{emp.name}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex flex-col">
                                                                <span>{emp.shift_name}</span>
                                                                <span className="text-[10px] text-muted-foreground">{emp.shift_time}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">{getStatusBadge(emp.status)}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <div className="flex flex-col gap-1 items-center">
                                                                {emp.check_in ? (
                                                                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">In: {emp.check_in}</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground/50 text-[10px]">-</span>
                                                                )}
                                                                {emp.check_out ? (
                                                                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">Out: {emp.check_out}</span>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {emp.late_minutes > 0 && (
                                                                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 mb-1">
                                                                    Telat {emp.late_minutes}m
                                                                </Badge>
                                                            )}
                                                            {emp.leave_description && (
                                                                <p className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={emp.leave_description}>
                                                                    {emp.leave_description}
                                                                </p>
                                                            )}
                                                            {emp.status === 'absen' && (
                                                                <span className="text-[10px] text-rose-500/70 italic">Belum ada tap</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                        Tidak ada data karyawan aktif.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm xl:col-span-1 flex flex-col h-[500px]">
                            <CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-2">
                                    <div className={BRAND_ICON_BOX + ' !p-2'}>
                                        <Ticket className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Ringkasan Tiket</CardTitle>
                                        <CardDescription className="text-xs">Tiket aktif bulan ini</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-6 flex flex-col gap-4 justify-center">
                                {tickets ? (
                                    <>
                                        <div className="text-center mb-2">
                                            <p className="text-5xl font-bold text-foreground">{tickets.total}</p>
                                            <p className="text-sm text-muted-foreground mt-2">Total Tiket Bulan Ini</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <div className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                    <span className="text-xs text-muted-foreground">Assigned</span>
                                                </div>
                                                <p className="text-xl font-semibold">{tickets.assigned}</p>
                                            </div>
                                            <div className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <span className="text-xs text-muted-foreground">In Progress</span>
                                                </div>
                                                <p className="text-xl font-semibold">{tickets.in_progress}</p>
                                            </div>
                                            <div className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                    <span className="text-xs text-muted-foreground">Pending</span>
                                                </div>
                                                <p className="text-xl font-semibold">{tickets.pending}</p>
                                            </div>
                                            <div className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                                    <span className="text-xs text-muted-foreground">Closed</span>
                                                </div>
                                                <p className="text-xl font-semibold text-emerald-600">{tickets.closed}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Activity className="h-8 w-8 opacity-20 mb-2 text-[#2E7D32]" />
                                        <p className="text-sm font-medium">Data tiket tidak tersedia</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
