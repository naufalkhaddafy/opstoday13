import { Head } from '@inertiajs/react';
import { BrandHeroHeader } from '@/components/shared/brand-hero-header';
import { dashboard } from '@/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, CalendarClock, Activity } from 'lucide-react';
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

export default function Dashboard({ stats, employeeStatuses, date }: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto">
                <BrandHeroHeader
                    compact
                    badge="Admin Dashboard"
                    title="Ringkasan Hari Ini"
                    subtitle={`Pantau status kehadiran karyawan untuk hari ${date}.`}
                />

                <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {/* KPI Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="hover:border-foreground/20 transition-colors bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Terjadwal</CardTitle>
                                <Users className="h-4 w-4 text-[#2E7D32]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.total_scheduled}</div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    Dari {stats.total_users} Karyawan Aktif
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-foreground/20 transition-colors bg-green-50/30 dark:bg-green-950/10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-green-800 dark:text-green-400">Kehadiran (Hadir)</CardTitle>
                                <UserCheck className="h-4 w-4 text-[#4CAF50]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-800 dark:text-green-400">{stats.total_present}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4CAF50]"></span>
                                    Sedang bekerja atau sudah absen pulang
                                </div>
                            </CardContent>
                        </Card>

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

                        <Card className="hover:border-foreground/20 transition-colors bg-yellow-50/30 dark:bg-yellow-950/10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Terlambat</CardTitle>
                                <Clock className="h-4 w-4 text-[#FDD835]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-yellow-800 dark:text-yellow-400">{stats.total_late}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FDD835]"></span>
                                    Melewati jam masuk shift
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance table */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-2">
                        <Card className="shadow-sm border-border/60 xl:col-span-2 flex flex-col h-[500px]">
                            <CardHeader className="border-b bg-muted/20 py-3 px-4 flex flex-row items-center justify-between space-y-0">
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

                        <Card className="shadow-sm border-border/60 xl:col-span-1 flex flex-col h-[500px]">
                            <CardHeader className="border-b bg-muted/20 py-3 px-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-[#2E7D32]" />
                                    Tiket Laporan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-6 flex flex-col items-center justify-center text-muted-foreground">
                                <Activity className="h-8 w-8 opacity-20 mb-2 text-[#2E7D32]" />
                                <p className="text-sm font-medium">Lihat di halaman publik</p>
                                <p className="text-xs mt-1 text-center opacity-70">
                                    Dashboard tiket tersedia di{' '}
                                    <a href="/" className="font-medium text-[#2E7D32] hover:underline">
                                        halaman utama
                                    </a>
                                    .
                                </p>
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
