import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EmployeeStatus } from '@/types/dashboard';

const ATTENDANCE_LABELS: Record<string, string> = {
    hadir: 'Present',
    tidak_lengkap: 'Incomplete',
    sakit: 'Sick Leave',
    izin: 'Excused',
    cuti: 'On Leave',
    absen: 'Absent',
    tidak_hadir: 'Absent',
    off_day: 'Day Off',
    on_duty: 'On Duty',
};

export function attendanceBadge(attendance: EmployeeStatus) {
    const status = attendance.status;
    const isOnDuty = attendance.check_in && !attendance.check_out;

    if (isOnDuty && (status === 'hadir' || status === 'tidak_lengkap')) {
        return <Badge className="border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{ATTENDANCE_LABELS.on_duty}</Badge>;
    }

    switch (status) {
        case 'hadir':
        case 'tidak_lengkap':
            return <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">{ATTENDANCE_LABELS[status]}</Badge>;
        case 'sakit':
            return <Badge className="border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400">{ATTENDANCE_LABELS[status]}</Badge>;
        case 'izin':
            return <Badge className="border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{ATTENDANCE_LABELS[status]}</Badge>;
        case 'cuti':
            return <Badge className="border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400">{ATTENDANCE_LABELS[status]}</Badge>;
        case 'absen':
        case 'tidak_hadir':
            return <Badge className="border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">{ATTENDANCE_LABELS[status]}</Badge>;
        default:
            return <Badge variant="outline" className="bg-muted/50 text-muted-foreground">{ATTENDANCE_LABELS.off_day}</Badge>;
    }
}

export function formatDate(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatShiftName(name: string): string {
    if (name.toUpperCase() === 'NON SHIFT') return 'N-SH';
    return name;
}

export function formatPeriodLabel(dateFrom: string, dateTo: string): string {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    
    // Check common periods
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateFrom === dateTo) {
        if (from.toDateString() === today.toDateString()) return 'Today';
        if (from.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return from.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    
    return `${from.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} - ${to.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}
