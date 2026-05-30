import { Head, Link, router, useForm } from '@inertiajs/react';
import { Search, FilterX, ChevronLeft, ChevronRight, Calendar, Building, HelpCircle, Download, Edit2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import RosterController from '@/actions/App/Http/Controllers/Admin/RosterController';
import RosterExportController from '@/actions/App/Http/Controllers/Admin/RosterExportController';
import RosterExceptionController from '@/actions/App/Http/Controllers/Admin/RosterExceptionController';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, useCallback, useEffect, useMemo } from 'react';

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

const MONTH_OPTIONS = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

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
        router.get(RosterController.index().url, { month: String(month), year: String(year) });
    };

    const handleExport = () => {
        const query = buildQuery();
        const params = new URLSearchParams(query).toString();
        window.location.href = RosterExportController.url() + '?' + params;
    };

    const isToday = (dateString: string) => {
        const todayStr = new Date().toLocaleDateString('sv');
        return dateString === todayStr;
    };

    // Generate year options: current year ± 3
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear - 3; y <= currentYear + 1; y++) {
            years.push(y);
        }
        return years;
    }, []);

    // Get compact badge for monthly grid
    const getShiftBadge = (day: RosterDay) => {
        const shift = day.shift;
        const dateStr = day.date;
        const today = isToday(dateStr);

        if (!shift) {
            return (
                <div className={`relative flex items-center justify-center h-7 text-[9px] font-medium text-muted-foreground/50 select-none ${today ? 'ring-1 ring-indigo-400 rounded' : ''} ${day.is_exception ? 'bg-amber-50/50 dark:bg-amber-950/20 rounded border border-dashed border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400' : ''}`}>
                    L
                    {day.is_exception && <AlertCircle className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-500" />}
                </div>
            );
        }

        const code = shift.code.toLowerCase();
        let bgClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

        if (code.includes('pagi-') || code === 'office' || code === 'steady') {
            bgClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
        } else if (code === 'shift') {
            bgClass = 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
        } else if (code.includes('sore')) {
            bgClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
        } else if (code.includes('malam')) {
            bgClass = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
        }

        // Compact display codes for narrow columns
        const codeMap: Record<string, string> = {
            'steady': 'STD',
            'shift': 'SFT',
            'pagi-7': 'P7',
            'pagi-8': 'P8',
            'pagi-9': 'P9',
            'sore': 'SRE',
            'malam': 'MLM',
        };
        const displayCode = codeMap[code] || shift.code.toUpperCase();

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={`relative flex items-center justify-center h-7 rounded text-[9px] font-bold tracking-wide cursor-help transition-all hover:scale-105 ${bgClass} ${today ? 'ring-2 ring-indigo-500 shadow-sm' : ''}`}>
                        {displayCode}
                        {day.is_exception && <AlertCircle className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-500" />}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                    <div className="text-xs space-y-0.5">
                        <p className="font-bold">{shift.name}</p>
                        <p className="text-muted-foreground">{shift.start_time} – {shift.end_time}</p>
                        <p className="text-[10px] text-muted-foreground">Tipe: {shift.type === 'steady' ? 'Steady Day' : 'Shift Rotating'}</p>
                        {day.is_exception && <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">Jadwal Khusus (Override)</p>}
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    };

    return (
        <>
            <Head title={`Roster Kerja – ${month_name} ${year}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-500" />
                                Roster Kerja Bulanan
                            </CardTitle>
                            <CardDescription>
                                Jadwal shift kerja seluruh karyawan untuk bulan {month_name} {year}.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Excel
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Control Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">

                            {/* Month/Year Navigation */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => navigateMonth(-1)}
                                    title="Bulan Sebelumnya"
                                    className="h-8 w-8"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <Select value={String(month)} onValueChange={handleMonthChange}>
                                    <SelectTrigger className="w-[130px] h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTH_OPTIONS.map((m) => (
                                            <SelectItem key={m.value} value={String(m.value)}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={String(year)} onValueChange={handleYearChange}>
                                    <SelectTrigger className="w-[90px] h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map((y) => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => navigateMonth(1)}
                                    title="Bulan Selanjutnya"
                                    className="h-8 w-8"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToCurrentMonth}
                                    className="h-8 text-xs"
                                >
                                    Bulan Ini
                                </Button>
                            </div>

                            {/* Search & Company Filter */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-full sm:w-[220px]">
                                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari karyawan..."
                                        className="pl-8 h-8 text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <Select value={companyFilter} onValueChange={handleCompanyChange}>
                                    <SelectTrigger className="w-full sm:w-[160px] h-8 text-sm">
                                        <SelectValue placeholder="Perusahaan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Perusahaan</SelectItem>
                                        {companies.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={groupFilter} onValueChange={handleGroupChange}>
                                    <SelectTrigger className="w-full sm:w-[160px] h-8 text-sm">
                                        <SelectValue placeholder="Grup / Divisi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Grup</SelectItem>
                                        {groups?.map((g) => (
                                            <SelectItem key={g.id} value={g.id.toString()}>
                                                {g.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(filters.search || (filters.company_id && filters.company_id !== 'all') || (filters.group_id && filters.group_id !== 'all')) && (
                                    <Button variant="ghost" size="sm" onClick={resetFilters} title="Reset Filter" className="h-8 px-2">
                                        <FilterX className="h-4 w-4 mr-1" /> Reset
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Roster Monthly Grid Table */}
                        <div className="rounded-md border overflow-x-auto bg-card">
                            <table className="w-full text-sm text-left border-collapse" style={{ minWidth: `${180 + month_days.length * 46 + 64}px` }}>
                                <thead>
                                    <tr className="bg-muted/50 text-muted-foreground border-b font-medium">
                                        <th className="px-3 py-2.5 min-w-[180px] border-r sticky left-0 bg-muted/50 z-20 text-xs">
                                            Karyawan
                                        </th>
                                        {month_days.map((day) => {
                                            const today = isToday(day.date);
                                            return (
                                                <th
                                                    key={day.date}
                                                    className={`px-0.5 py-2 text-center border-r last:border-0 w-[44px] min-w-[44px] ${
                                                        day.is_weekend
                                                            ? 'bg-rose-50/50 dark:bg-rose-950/10'
                                                            : ''
                                                    } ${
                                                        today
                                                            ? 'bg-indigo-50/60 dark:bg-indigo-950/20'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center gap-0">
                                                        <span className={`text-[9px] uppercase tracking-wider ${day.is_weekend ? 'text-rose-500 dark:text-rose-400' : ''} ${today ? 'text-indigo-600 font-bold dark:text-indigo-300' : ''}`}>
                                                            {day.day_name_short}
                                                        </span>
                                                        <span className={`text-[11px] font-semibold ${today ? 'bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                                                            {day.day}
                                                        </span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                        <th className="px-2 py-2.5 text-center min-w-[56px] text-xs">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {roster.length > 0 ? (
                                        roster.map((emp) => (
                                            <tr key={emp.id} className="transition-colors hover:bg-muted/30">
                                                <td className="px-3 py-2 border-r sticky left-0 bg-card z-10">
                                                    <div className="font-semibold text-foreground text-xs leading-tight">{emp.name}</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 flex flex-col gap-0">
                                                        {emp.employee_id && <span>ID: {emp.employee_id}</span>}
                                                        {emp.company && (
                                                            <span className="flex items-center gap-0.5">
                                                                <Building className="h-2.5 w-2.5 inline" /> {emp.company.name}
                                                            </span>
                                                        )}
                                                        {emp.group && (
                                                            <span className="ml-3 text-[9px]">{emp.group.name}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {emp.schedule.map((day, idx) => {
                                                    const dayMeta = month_days[idx];
                                                    const today = isToday(day.date);
                                                    return (
                                                        <td
                                                            key={day.date}
                                                            onClick={() => openExceptionModal(emp.id, emp.name, day.date, day.shift)}
                                                            className={`px-0.5 py-1.5 text-center border-r last:border-0 cursor-pointer transition-colors hover:bg-muted/80 ${
                                                                dayMeta?.is_weekend
                                                                    ? 'bg-rose-50/30 dark:bg-rose-950/5'
                                                                    : ''
                                                            } ${
                                                                today ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                                                            }`}
                                                        >
                                                            {getShiftBadge(day)}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-2 py-2 text-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                                <Link href={UserController.edit({ user: emp.id }).url + '?from=roster'}>
                                                                    <Edit2 className="h-3 w-3" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit Jadwal</TooltipContent>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={month_days.length + 2} className="h-32 text-center text-muted-foreground">
                                                Tidak ada data roster karyawan yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 p-3 rounded-lg border bg-muted/20 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                Keterangan:
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-4 w-7 rounded bg-emerald-100 dark:bg-emerald-900/30 inline-flex items-center justify-center text-[8px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">STD</span>
                                <span>Steady Day</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-4 w-7 rounded bg-violet-100 dark:bg-violet-900/30 inline-flex items-center justify-center text-[8px] font-bold text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">SFT</span>
                                <span>Shift (Rotating)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-4 w-7 rounded bg-emerald-100 dark:bg-emerald-900/30 inline-flex items-center justify-center text-[8px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">P7</span>
                                <span>Pagi 07:00</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-4 w-7 rounded bg-amber-100 dark:bg-amber-900/30 inline-flex items-center justify-center text-[8px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">SRE</span>
                                <span>Shift Sore</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-4 w-7 rounded bg-indigo-100 dark:bg-indigo-900/30 inline-flex items-center justify-center text-[8px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">MLM</span>
                                <span>Shift Malam</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground/50 font-bold text-[10px]">L</span>
                                <span>Libur</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-4">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                <span>Jadwal Khusus (Override)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Exception Modal */}
            <Dialog open={exceptionModal.isOpen} onOpenChange={(open) => !open && closeExceptionModal()}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submitException}>
                        <DialogHeader>
                            <DialogTitle>Kustomisasi Jadwal Harian</DialogTitle>
                            <DialogDescription>
                                Ubah jadwal untuk <strong>{exceptionModal.userName}</strong> pada tanggal <strong>{new Date(exceptionModal.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="shift">Pilih Shift</Label>
                                <Select 
                                    value={exceptionData.shift_id} 
                                    onValueChange={(val) => setExceptionData('shift_id', val)}
                                >
                                    <SelectTrigger id="shift">
                                        <SelectValue placeholder="Pilih shift..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-rose-600 font-medium">Libur (Off)</SelectItem>
                                        {shifts.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name} ({s.code.toUpperCase()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Pengecualian ini akan menimpa jadwal mingguan karyawan hanya untuk tanggal ini saja.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button 
                                type="button" 
                                variant="destructive" 
                                onClick={removeException}
                                disabled={processingException}
                            >
                                Hapus Pengecualian
                            </Button>
                            <Button type="submit" disabled={processingException}>
                                Simpan Jadwal
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
