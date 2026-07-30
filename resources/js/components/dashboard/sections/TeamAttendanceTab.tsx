import { Deferred } from '@inertiajs/react';
import { Users, UserCheck, UserX, Clock, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniStat } from '@/components/dashboard/MetricCards';
import { EngineerCard } from '@/components/dashboard/EngineerCard';
import { EngineerCardSkeleton } from '@/components/dashboard/Skeletons';
import { DonutChart } from '@/components/dashboard/DonutChart';
import { DisciplineTable } from '@/components/leaderboard/DisciplineTable';
import { LateTrendChart } from '@/components/charts/LateTrendChart';
import { formatDate, formatPeriodLabel } from '@/components/dashboard/helpers';
import { Segment } from '@/types/dashboard';

interface TeamAttendanceTabProps {
    selectedCompany?: string;
    isSingleDay: boolean;
    dateFrom: string;
    dateTo: string;
    defaultDateFrom: string;
    defaultDateTo: string;
    holidayName?: string | null;
    attendance?: any;
    stats: any;
    attendanceSegments: Segment[];
    analytics?: any;
    engineers?: any[];
    attendanceByUserId: Map<number, any>;
    onResetToToday: () => void;
}

export function TeamAttendanceTab({
    selectedCompany,
    isSingleDay,
    dateFrom,
    dateTo,
    defaultDateFrom,
    defaultDateTo,
    holidayName,
    attendance,
    stats,
    attendanceSegments,
    analytics,
    engineers,
    attendanceByUserId,
    onResetToToday,
}: TeamAttendanceTabProps) {
    const isFilteredDate = dateFrom !== defaultDateFrom || dateTo !== defaultDateTo;

    return (
        <div className="flex flex-col gap-8 mt-0">
            {/* Section: Attendance Overview */}
            <section className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Users className="h-5 w-5 text-[#2E7D32]" /> Attendance Overview {selectedCompany && `- ${selectedCompany}`}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 -mt-2 mb-2">
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            {isSingleDay ? `Summary for ${formatDate(dateFrom)}.` : `Summary for ${formatPeriodLabel(dateFrom, dateTo)}.`}
                        </p>
                        {isSingleDay && holidayName && (
                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400 font-normal shadow-sm">
                                Hari Libur: {holidayName}
                            </Badge>
                        )}
                    </div>
                    {isFilteredDate && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onResetToToday}
                            className="h-6 px-2 text-xs"
                        >
                            Reset to Today
                        </Button>
                    )}
                </div>
                <Deferred data={["attendance"]} fallback={
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-48"></CardContent></Card>
                        <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="h-48"></CardContent></Card>
                    </div>
                }>
                    {attendance && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {isSingleDay ? 'Attendance' : `Attendance · ${formatPeriodLabel(dateTo, dateTo)}`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DonutChart segments={attendanceSegments} centerLabel="Scheduled" centerValue={stats.total_scheduled} />
                                </CardContent>
                            </Card>
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Users className="h-4 w-4" /> Team Attendance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-3">
                                    <MiniStat label="Present" value={stats.total_present} icon={<UserCheck className="h-4 w-4 text-[#4CAF50]" />} />
                                    <MiniStat label="Absent" value={stats.total_absent} icon={<UserX className="h-4 w-4 text-rose-500" />} />
                                    <MiniStat label="Late" value={stats.total_late} icon={<Clock className="h-4 w-4 text-[#FDD835]" />} />
                                    <MiniStat label="On Leave" value={stats.total_leave} icon={<CalendarClock className="h-4 w-4 text-[#2E7D32]" />} />
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </Deferred>

                <Deferred data={["analytics"]} fallback={
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Card className="border-border/60 shadow-sm animate-pulse lg:col-span-1"><CardContent className="h-64"></CardContent></Card>
                        <Card className="border-border/60 shadow-sm animate-pulse lg:col-span-2"><CardContent className="h-64"></CardContent></Card>
                    </div>
                }>
                    {analytics && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="lg:col-span-1">
                                <DisciplineTable leaderboard={analytics.leaderboard.slice(0, 10)} />
                            </div>
                            <div className="lg:col-span-2">
                                <LateTrendChart data={analytics.lateTrend} />
                            </div>
                        </div>
                    )}
                </Deferred>
            </section>

            {/* Section: Team overview (attendance + tickets) */}
            <section className="flex flex-col gap-4">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Users className="h-5 w-5 text-[#2E7D32]" /> Team Operations Overview {selectedCompany && `- ${selectedCompany}`}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Engineer attendance and ticket workload for the selected filters.
                    </p>
                </div>
                <Deferred data={["engineers", "attendance"]} fallback={
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <EngineerCardSkeleton /><EngineerCardSkeleton /><EngineerCardSkeleton />
                    </div>
                }>
                    {engineers && attendance && (
                        engineers.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {engineers.map((engineer) => {
                                    const periodStr = dateFrom === dateTo
                                        ? dateFrom
                                        : `${dateFrom} to ${dateTo}`;

                                    return (
                                        <EngineerCard
                                            key={engineer.id}
                                            engineer={engineer}
                                            attendance={attendanceByUserId.get(engineer.id) ?? null}
                                            variant="attendance"
                                            periodDateStr={periodStr}
                                            companyName={selectedCompany}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="border-border/60 shadow-sm">
                                <CardContent className="p-8 text-center text-muted-foreground">No engineers registered yet.</CardContent>
                            </Card>
                        )
                    )}
                </Deferred>
            </section>
        </div>
    );
}
