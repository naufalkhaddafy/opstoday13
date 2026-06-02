import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, CalendarClock, UserMinus, Activity, Bell, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    stats: Stats;
    employeeStatuses: EmployeeStatus[];
    date: string;
};

export default function Dashboard({ stats, employeeStatuses, date }: DashboardProps) {
    // Helper to format status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'hadir':
            case 'tidak_lengkap':
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">Hadir</Badge>;
            case 'sakit':
            case 'izin':
            case 'cuti':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 capitalize">{status}</Badge>;
            case 'absen':
            case 'tidak_hadir':
                return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100/80 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800">Alpha</Badge>;
            case 'off_day':
            default:
                return <Badge variant="outline" className="text-muted-foreground bg-muted/50">Libur</Badge>;
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Ringkasan Hari Ini</h1>
                        <p className="text-muted-foreground mt-1">Pantau status kehadiran karyawan untuk hari {date}.</p>
                    </div>
                </div>

                {/* KPI Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Karyawan Aktif */}
                    <Card className="hover:border-foreground/20 transition-colors bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Terjadwal</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_scheduled}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                Dari {stats.total_users} Karyawan Aktif
                            </p>
                        </CardContent>
                    </Card>

                    {/* Hadir */}
                    <Card className="hover:border-foreground/20 transition-colors bg-emerald-50/30 dark:bg-emerald-950/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Kehadiran (Hadir)</CardTitle>
                            <UserCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.total_present}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Sedang bekerja atau sudah absen pulang
                            </div>
                        </CardContent>
                    </Card>

                    {/* Belum Hadir / Alpha */}
                    <Card className="hover:border-foreground/20 transition-colors bg-rose-50/30 dark:bg-rose-950/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Belum Hadir (Alpha)</CardTitle>
                            <UserX className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-rose-700 dark:text-rose-400">{stats.total_absent}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Terjadwal namun belum tap in
                            </div>
                        </CardContent>
                    </Card>

                    {/* Terlambat */}
                    <Card className="hover:border-foreground/20 transition-colors bg-amber-50/30 dark:bg-amber-950/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Terlambat</CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.total_late}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Melewati jam masuk shift
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Bottom Section: Side-by-side Table and Tickets */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-2">
                    
                    {/* Left Column: Daftar Kehadiran (col-span-2) */}
                    <Card className="shadow-sm border-border/60 xl:col-span-2 flex flex-col h-[500px]">
                        <CardHeader className="border-b bg-muted/20 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="h-4 w-4 text-indigo-500" />
                                Daftar Kehadiran Karyawan
                            </CardTitle>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/50">
                                <CalendarClock className="h-4 w-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{stats.total_leave} Cuti / Izin</span>
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
                                                    <td className="px-4 py-2">
                                                        {getStatusBadge(emp.status)}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            {emp.check_in ? <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">In: {emp.check_in}</span> : <span className="text-muted-foreground/50 text-[10px]">-</span>}
                                                            {emp.check_out ? <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">Out: {emp.check_out}</span> : null}
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

                    {/* Right Column: Placeholder untuk Tickets (col-span-1) */}
                    <Card className="shadow-sm border-border/60 xl:col-span-1 flex flex-col h-[500px]">
                        <CardHeader className="border-b bg-muted/20 py-3 px-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
                                Tiket Laporan (Segera Hadir)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-6 flex flex-col items-center justify-center text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 mb-2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
                            <p className="text-sm font-medium">Belum ada fitur tiket</p>
                            <p className="text-xs mt-1 text-center opacity-70">Bagian ini disiapkan untuk antrian tiket/laporan mendatang.</p>
                        </CardContent>
                    </Card>

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
