import { useState, useCallback, useEffect, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, Download, CalendarRange } from 'lucide-react';
import { BRAND_ICON_BOX } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RosterController from '@/actions/App/Http/Controllers/Admin/RosterController';
import RosterExportController from '@/actions/App/Http/Controllers/Admin/RosterExportController';
import RosterExceptionController from '@/actions/App/Http/Controllers/Admin/RosterExceptionController';

import { RosterFilters } from '@/components/admin/roster/RosterFilters';
import { RosterGrid } from '@/components/admin/roster/RosterGrid';
import { RosterLegend } from '@/components/admin/roster/RosterLegend';
import { RosterExceptionModal } from '@/components/admin/roster/RosterExceptionModal';

type Shift = {
    id: number;
    code: string;
    name: string;
    start_time: string;
    end_time: string;
    type: 'steady' | 'shift';
};

type RosterDay = {
    date: string;
    is_exception: boolean;
    is_holiday: boolean;
    leave?: { type: string; description: string | null } | null;
    shift: Shift | null;
};

type EmployeeRoster = {
    id: number;
    name: string;
    employee_id: string | null;
    company: { id: number; name: string } | null;
    group?: { id: number; name: string } | null;
    schedule: RosterDay[];
};

type MonthDay = {
    date: string;
    day: number;
    day_name: string;
    day_name_short: string;
    is_weekend: boolean;
    is_holiday: boolean;
};

type RosterProps = {
    roster: EmployeeRoster[];
    month_days: MonthDay[];
    month: number;
    year: number;
    month_name: string;
    shifts: Shift[];
    companies: { id: number; name: string }[];
    groups: { id: number; name: string }[];
    filters: {
        search?: string;
        company_id?: string;
        group_id?: string;
    };
};

export default function RosterIndex({
    roster,
    month_days,
    month,
    year,
    month_name,
    shifts,
    companies,
    groups,
    filters,
}: RosterProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [companyFilter, setCompanyFilter] = useState(filters.company_id || 'all');
    const [groupFilter, setGroupFilter] = useState(filters.group_id || 'all');
    const [isLoading, setIsLoading] = useState(false);

    // Stop loading when new roster data arrives
    useEffect(() => {
        setIsLoading(false);
    }, [roster]);

    // Cleanup loading when inertia starts/finishes manually just in case
    useEffect(() => {
        const unbindStart = router.on('start', () => setIsLoading(true));
        const unbindFinish = router.on('finish', () => setIsLoading(false));
        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Exception Modal State
    const [exceptionModal, setExceptionModal] = useState<{
        isOpen: boolean;
        userId: number | null;
        userName: string;
        date: string;
    }>({ isOpen: false, userId: null, userName: '', date: '' });

    const { data: exceptionData, setData: setExceptionData, post: postException, delete: deleteException, processing: processingException, reset: resetException, transform: transformException } = useForm({
        user_id: '',
        date: '',
        shift_id: 'none',
    });

    transformException((data) => ({
        ...data,
        shift_id: data.shift_id === 'none' ? null : data.shift_id,
    }));

    const openExceptionModal = (userId: number, userName: string, date: string, currentShift: Shift | null) => {
        setExceptionModal({ isOpen: true, userId, userName, date });
        setExceptionData({
            user_id: userId.toString(),
            date: date,
            shift_id: currentShift ? currentShift.id.toString() : 'none',
        });
    };

    const closeExceptionModal = () => {
        setExceptionModal({ ...exceptionModal, isOpen: false });
        setTimeout(() => resetException(), 200);
    };

    const submitException = (e: React.FormEvent) => {
        e.preventDefault();
        const url = RosterExceptionController.store().url;
        
        postException(url, {
            preserveScroll: true,
            onSuccess: () => closeExceptionModal()
        });
    };

    const removeException = () => {
        const url = RosterExceptionController.destroy().url;
        router.delete(url, {
            data: { user_id: exceptionData.user_id, date: exceptionData.date } as any,
            preserveScroll: true,
            onSuccess: () => closeExceptionModal()
        });
    };

    const buildQuery = useCallback(
        (overrides: Record<string, string | number | undefined> = {}) => {
            const query: Record<string, string> = {};

            const searchVal = overrides.search !== undefined ? String(overrides.search || '') : searchTerm;
            if (searchVal) query.search = searchVal;

            const companyVal = overrides.company_id !== undefined ? String(overrides.company_id) : companyFilter;
            if (companyVal !== 'all') query.company_id = companyVal;

            const groupVal = overrides.group_id !== undefined ? String(overrides.group_id) : groupFilter;
            if (groupVal !== 'all') query.group_id = groupVal;

            const m = overrides.month !== undefined ? overrides.month : month;
            const y = overrides.year !== undefined ? overrides.year : year;
            query.month = String(m);
            query.year = String(y);

            return query;
        },
        [searchTerm, companyFilter, groupFilter, month, year]
    );

    const navigate = useCallback(
        (overrides: Record<string, string | number | undefined> = {}) => {
            const query = buildQuery(overrides);
            setIsLoading(true);
            router.get(RosterController.index().url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQuery]
    );

    // Debounce search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (filters.search || '')) {
                navigate({ search: searchTerm });
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters.search, navigate]);

    const handleCompanyChange = (value: string) => {
        setCompanyFilter(value);
        navigate({ company_id: value });
    };

    const handleGroupChange = (value: string) => {
        setGroupFilter(value);
        navigate({ group_id: value });
    };

    const handleMonthChange = (value: string) => {
        navigate({ month: parseInt(value) });
    };

    const handleYearChange = (value: string) => {
        navigate({ year: parseInt(value) });
    };

    const navigateMonth = (delta: number) => {
        let newMonth = month + delta;
        let newYear = year;
        if (newMonth < 1) { newMonth = 12; newYear--; }
        if (newMonth > 12) { newMonth = 1; newYear++; }
        navigate({ month: newMonth, year: newYear });
    };

    const goToCurrentMonth = () => {
        const now = new Date();
        navigate({ month: now.getMonth() + 1, year: now.getFullYear() });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setCompanyFilter('all');
        setGroupFilter('all');
        setIsLoading(true);
        router.get(RosterController.index().url, { month: String(month), year: String(year) });
    };

    const handleExport = () => {
        const query = buildQuery();
        const params = new URLSearchParams(query).toString();
        window.location.href = RosterExportController.url() + '?' + params;
    };

    return (
        <>
            <Head title={`Roster Kerja – ${month_name} ${year}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 mb-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <CalendarRange className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Roster Kerja Bulanan</CardTitle>
                                <CardDescription>Jadwal shift karyawan {month_name} {year}</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Excel
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Control Bar */}
                        <RosterFilters
                            month={month}
                            year={year}
                            searchTerm={searchTerm}
                            companyFilter={companyFilter}
                            groupFilter={groupFilter}
                            companies={companies}
                            groups={groups}
                            filters={filters}
                            setSearchTerm={setSearchTerm}
                            handleCompanyChange={handleCompanyChange}
                            handleGroupChange={handleGroupChange}
                            handleMonthChange={handleMonthChange}
                            handleYearChange={handleYearChange}
                            navigateMonth={navigateMonth}
                            goToCurrentMonth={goToCurrentMonth}
                            resetFilters={resetFilters}
                        />

                        {/* Roster Monthly Grid Table */}
                        <RosterGrid
                            roster={roster}
                            month_days={month_days}
                            isLoading={isLoading}
                            openExceptionModal={openExceptionModal}
                        />

                        {/* Legend */}
                        <RosterLegend />
                    </CardContent>
                </Card>
            </div>

            {/* Exception Modal */}
            <RosterExceptionModal
                isOpen={exceptionModal.isOpen}
                userName={exceptionModal.userName}
                date={exceptionModal.date}
                shifts={shifts}
                exceptionData={{
                    user_id: exceptionData.user_id,
                    date: exceptionData.date,
                    shift_id: exceptionData.shift_id,
                }}
                processingException={processingException}
                setExceptionData={(key, value) => setExceptionData(key, value)}
                closeExceptionModal={closeExceptionModal}
                submitException={submitException}
                removeException={removeException}
            />
        </>
    );
}

RosterIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roster Kerja Karyawan',
            href: '#',
        },
    ],
};
