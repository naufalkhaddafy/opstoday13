import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User as UserIcon, Clock, Calendar, Coffee } from 'lucide-react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import RosterController from '@/actions/App/Http/Controllers/Admin/RosterController';
import { BRAND_ICON_BOX, BRAND_PAGE_HEADER } from '@/lib/brand';

type User = {
    id: number;
    name: string;
    email: string;
    employee_id: string | null;
    is_active?: boolean;
};

type CurrentShift = {
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    days: number[];
    is_exception?: boolean;
} | null;

type AttendanceHeaderProps = {
    user: User;
    currentMonthName: string;
    year: number;
    totalScheduled: number;
    currentShift: CurrentShift;
    hideBackButton?: boolean;
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

export function AttendanceHeader({
    user,
    currentMonthName,
    year,
    totalScheduled,
    currentShift,
    hideBackButton
}: AttendanceHeaderProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 flex flex-col justify-between p-6 ${BRAND_PAGE_HEADER}`}>
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <UserIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                                    {user.is_active === false && (
                                        <Badge variant="destructive">Account Inactive</Badge>
                                    )}
                                </div>
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
                        {!hideBackButton && (
                            <Button variant="outline" asChild className="shrink-0 w-full sm:w-auto">
                                <Link href={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'roster' ? RosterController.index().url : UserController.index().url}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-4 sm:gap-12">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Periode Laporan</p>
                        <p className="text-base font-semibold">{currentMonthName} {year}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Hari Kerja</p>
                        <p className="text-base font-semibold">{totalScheduled} Hari</p>
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
                    {currentShift ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight">{currentShift.name}</h3>
                                <Badge variant="secondary" className="mt-1 font-mono">{currentShift.code}</Badge>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-border/50">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" /> Jam Kerja
                                    </span>
                                    <span className="font-medium">{currentShift.start_time} - {currentShift.end_time}</span>
                                </div>
                                <div className="flex flex-col gap-1.5 text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" /> Jadwal Mingguan
                                    </span>
                                    <span className="font-medium bg-muted/50 p-2 rounded-md text-center">
                                        {formatShiftDays(currentShift.days)}
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
    );
}
