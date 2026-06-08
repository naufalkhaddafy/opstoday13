import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, CheckCircle2, Timer } from 'lucide-react';
import { EngineerSummary, EmployeeStatus } from '@/types/dashboard';
import { formatShiftName, attendanceBadge } from './helpers';

const TICKET_CHART_COLORS = {
    assigned: '#1B5E20', // Green 900
    pending: '#F9A825',  // Yellow 800
    inProgress: '#4CAF50',// Green 500
    completed: '#2E7D32', // Green 800
};

export function EngineerCard({ engineer, attendance }: { engineer: EngineerSummary; attendance?: EmployeeStatus | null }) {
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
                                <p className="text-xs text-muted-foreground">{engineer.employee_id ?? '-'}</p>
                            </div>
                            {attendance ? attendanceBadge(attendance) : (
                                <Badge variant="outline" className="shrink-0 bg-muted/50 text-muted-foreground">No data</Badge>
                            )}
                        </div>

                        {attendance && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
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
                                {attendance.late_minutes > 0 && (
                                    <span className="font-medium text-rose-600">Late {attendance.late_minutes}m</span>
                                )}
                                {attendance.early_leave_minutes > 0 && (
                                    <span className="font-medium text-[#F9A825]">Early {attendance.early_leave_minutes}m</span>
                                )}
                                {attendance.extended_minutes > 0 && (
                                    <span className="font-medium text-[#2E7D32]">Extended {attendance.extended_minutes}m</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 border-t pt-3">
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
                </div>
            </CardContent>
        </Card>
    );
}
