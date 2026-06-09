import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, CheckCircle2, Timer, Clock, ArrowRightCircle, PlusCircle } from 'lucide-react';
import { EngineerSummary, EmployeeStatus } from '@/types/dashboard';
import { formatShiftName, attendanceBadge } from './helpers';

const TICKET_CHART_COLORS = {
    assigned: '#1B5E20', // Green 900
    pending: '#F9A825',  // Yellow 800
    inProgress: '#4CAF50',// Green 500
    completed: '#2E7D32', // Green 800
};

type EngineerCardProps = {
    engineer: EngineerSummary;
    attendance?: EmployeeStatus | null;
    variant?: 'tickets' | 'attendance' | 'combined';
    periodDateStr?: string;
    companyName?: string;
};

export function EngineerCard({ engineer, attendance, variant = 'combined', periodDateStr, companyName }: EngineerCardProps) {
    const initials = engineer.name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase();

    const max = Math.max(engineer.assigned, engineer.pending, engineer.in_progress, engineer.completed_today, 1);
    const bars = [
        { label: 'Assigned', value: engineer.assigned, color: TICKET_CHART_COLORS.assigned },
        { label: 'Pending', value: engineer.pending, color: TICKET_CHART_COLORS.pending },
        { label: 'In Progress', value: engineer.in_progress, color: TICKET_CHART_COLORS.inProgress },
        { label: 'Completed', value: engineer.completed_today, color: TICKET_CHART_COLORS.completed },
    ];

    const showAttendanceTop = variant !== 'tickets';
    const showTicketBars = variant !== 'attendance';

    return (
        <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] text-sm font-semibold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">{engineer.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {engineer.employee_id ?? '-'}
                                    {companyName && (
                                        <>
                                            <span className="mx-1.5">•</span>
                                            <span className="font-medium text-primary/80">{companyName}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                            {attendance ? attendanceBadge(attendance) : (
                                <Badge variant="outline" className="shrink-0 bg-muted/50 text-muted-foreground">No data</Badge>
                            )}
                        </div>

                        {attendance && (
                            <div className="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground">
                                <div className="font-semibold text-primary/80">Today's Data:</div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="flex items-center gap-1">
                                        <CalendarClock className="h-3 w-3 text-[#2E7D32]" />
                                        {formatShiftName(attendance.shift_name)} · {attendance.shift_time}
                                    </span>
                                    {(attendance.check_in || attendance.check_out) && (
                                        <span className="font-mono">
                                            {attendance.check_in ? `In ${attendance.check_in}` : ''}
                                            {attendance.check_in && attendance.check_out ? ' · ' : ''}
                                            {attendance.check_out ? `Out ${attendance.check_out}` : ''}
                                        </span>
                                    )}
                                </div>
                                {(attendance.late_minutes > 0 || attendance.early_leave_minutes > 0 || attendance.extended_minutes > 0) && (
                                    <div className="flex flex-wrap items-center gap-2 font-medium">
                                        {attendance.late_minutes > 0 && <span className="text-rose-500">Late {attendance.late_minutes}m</span>}
                                        {attendance.early_leave_minutes > 0 && <span className="text-[#F9A825]">Early {attendance.early_leave_minutes}m</span>}
                                        {attendance.extended_minutes > 0 && <span className="text-[#2E7D32]">Extended {attendance.extended_minutes}m</span>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 border-t pt-3">
                    {showTicketBars && (
                        <>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tickets in Period</span>
                                <span className="text-lg font-bold text-foreground">{engineer.total}</span>
                            </div>
                            <div className="space-y-2">
                                {bars.map((bar) => (
                                    <div key={bar.label} className="flex items-center gap-2">
                                        <span className="w-20 shrink-0 text-[11px] text-muted-foreground">{bar.label}</span>
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${(bar.value / max) * 100}%`, backgroundColor: bar.color }}
                                            />
                                        </div>
                                        <span className="w-5 text-right text-xs font-semibold text-foreground">{bar.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {(variant === 'tickets' || variant === 'combined') && (
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                            <div className="rounded-lg border border-green-200/60 bg-green-50/50 p-2.5 dark:border-green-900/40 dark:bg-green-950/20">
                                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    <Timer className="h-3 w-3 text-[#2E7D32]" />
                                    Avg Response
                                </div>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                    {engineer.avg_response_time_label ?? 'No data'}
                                </p>
                            </div>
                            <div className="rounded-lg border border-yellow-200/60 bg-yellow-50/50 p-2.5 dark:border-yellow-900/40 dark:bg-yellow-950/20">
                                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    <CheckCircle2 className="h-3 w-3 text-[#F9A825]" />
                                    Avg Resolution
                                </div>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                    {engineer.avg_resolution_time_label ?? 'No data'}
                                </p>
                            </div>
                        </div>
                    )}

                    {variant === 'attendance' && (
                        <div className="mt-1">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Overview by Period {periodDateStr && `(${periodDateStr})`}
                                </span>
                            </div>
                            
                            <div className="mb-3 grid grid-cols-5 gap-1 text-center">
                                <div className="rounded-md bg-muted/30 p-1.5">
                                    <div className="text-[10px] font-medium text-muted-foreground">Present</div>
                                    <div className="text-xs font-semibold text-foreground">{attendance?.period_stats?.present_days ?? 0}d</div>
                                </div>
                                <div className="rounded-md bg-muted/30 p-1.5">
                                    <div className="text-[10px] font-medium text-muted-foreground">Leave</div>
                                    <div className="text-xs font-semibold text-foreground">{attendance?.period_stats?.leave_days ?? 0}d</div>
                                </div>
                                <div className="rounded-md bg-muted/30 p-1.5">
                                    <div className="text-[10px] font-medium text-muted-foreground">Sick</div>
                                    <div className="text-xs font-semibold text-foreground">{attendance?.period_stats?.sick_days ?? 0}d</div>
                                </div>
                                <div className="rounded-md bg-muted/30 p-1.5">
                                    <div className="text-[10px] font-medium text-muted-foreground">Permit</div>
                                    <div className="text-xs font-semibold text-foreground">{attendance?.period_stats?.permit_days ?? 0}d</div>
                                </div>
                                <div className="rounded-md bg-muted/30 p-1.5">
                                    <div className="text-[10px] font-medium text-muted-foreground">Absent</div>
                                    <div className="text-xs font-semibold text-foreground">{attendance?.period_stats?.absent_days ?? 0}d</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-lg border border-rose-200/60 bg-rose-50/50 p-2.5 dark:border-rose-900/40 dark:bg-rose-950/20">
                                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                        <Clock className="h-3 w-3 text-rose-500" />
                                        Late
                                    </div>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {attendance?.period_stats?.late_minutes ? `${attendance.period_stats.late_minutes} min` : '0 min'}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-yellow-200/60 bg-yellow-50/50 p-2.5 dark:border-yellow-900/40 dark:bg-yellow-950/20">
                                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                        <ArrowRightCircle className="h-3 w-3 text-[#F9A825]" />
                                        Early
                                    </div>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {attendance?.period_stats?.early_leave_minutes ? `${attendance.period_stats.early_leave_minutes} min` : '0 min'}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-green-200/60 bg-green-50/50 p-2.5 dark:border-green-900/40 dark:bg-green-950/20">
                                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                        <PlusCircle className="h-3 w-3 text-[#2E7D32]" />
                                        Extended
                                    </div>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {attendance?.period_stats?.extended_minutes ? `${attendance.period_stats.extended_minutes} min` : '0 min'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 rounded-lg border border-indigo-200/60 bg-indigo-50/50 p-2.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    <CalendarClock className="h-3 w-3 text-indigo-500" />
                                    Total Scheduled Working Days
                                </div>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                    {attendance?.period_stats?.scheduled_working_days ?? 0} Days
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
