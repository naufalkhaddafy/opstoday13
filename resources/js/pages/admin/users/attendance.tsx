import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';

import { AttendanceHeader } from '@/components/admin/users/attendance/AttendanceHeader';
import { AttendanceFilters } from '@/components/admin/users/attendance/AttendanceFilters';
import { AttendanceSummaryCards } from '@/components/admin/users/attendance/AttendanceSummaryCards';
import { AttendanceTable } from '@/components/admin/users/attendance/AttendanceTable';

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
    total_overtime_days: number;
    total_overtime_minutes: number;
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

export default function UserAttendance({ user, attendance_logs, summary, current_shift, filters }: AttendanceProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Stop loading when new data arrives
    useEffect(() => {
        setIsLoading(false);
    }, [attendance_logs, summary]);

    // Cleanup loading when inertia starts/finishes manually just in case
    useEffect(() => {
        const unbindStart = router.on('start', () => setIsLoading(true));
        const unbindFinish = router.on('finish', () => setIsLoading(false));
        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    const handleFilterChange = (key: 'month' | 'year', value: string) => {
        const newFilters = {
            ...filters,
            [key]: parseInt(value, 10),
        };
        setIsLoading(true);
        router.get(UserController.attendance({ user: user.id }).url, newFilters, { preserveState: true, preserveScroll: true });
    };

    const handlePrevMonth = () => {
        let newMonth = filters.month - 1;
        let newYear = filters.year;
        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }
        setIsLoading(true);
        router.get(UserController.attendance({ user: user.id }).url, { month: newMonth, year: newYear }, { preserveState: true, preserveScroll: true });
    };

    const handleNextMonth = () => {
        let newMonth = filters.month + 1;
        let newYear = filters.year;
        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }
        setIsLoading(true);
        router.get(UserController.attendance({ user: user.id }).url, { month: newMonth, year: newYear }, { preserveState: true, preserveScroll: true });
    };

    const currentMonthName = useMemo(() => {
        return MONTH_NAMES.find(m => m.value === filters.month)?.name || '';
    }, [filters.month]);

    return (
        <>
            <Head title={`Detail Kehadiran: ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
                {/* Upper Section: User details & Current Shift Card */}
                <AttendanceHeader
                    user={user}
                    currentMonthName={currentMonthName}
                    year={filters.year}
                    totalScheduled={summary.total_scheduled}
                    currentShift={current_shift}
                />

                {/* Filter & Navigation Bar */}
                <AttendanceFilters
                    filters={filters}
                    currentMonthName={currentMonthName}
                    handleFilterChange={handleFilterChange}
                    handlePrevMonth={handlePrevMonth}
                    handleNextMonth={handleNextMonth}
                />

                {/* Monthly Summary Statistics Grid */}
                <AttendanceSummaryCards summary={summary} />

                {/* Table Section */}
                <AttendanceTable
                    logs={attendance_logs}
                    currentMonthName={currentMonthName}
                    isLoading={isLoading}
                />
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
