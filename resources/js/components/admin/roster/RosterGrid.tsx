import { Building, Edit2, AlertCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';

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
};

type RosterGridProps = {
    roster: EmployeeRoster[];
    month_days: MonthDay[];
    isLoading: boolean;
    openExceptionModal: (userId: number, userName: string, date: string, shift: Shift | null) => void;
};

const isToday = (dateString: string) => {
    const todayStr = new Date().toLocaleDateString('sv');
    return dateString === todayStr;
};

const getShiftBadge = (day: RosterDay) => {
    const shift = day.shift;
    const dateStr = day.date;
    const today = isToday(dateStr);
    const leave = day.leave;

    if (leave) {
        let bgClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        let displayCode = 'CTI';
        let tooltipText = 'Cuti';

        if (leave.type === 'sakit') {
            bgClass = 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
            displayCode = 'SKT';
            tooltipText = 'Sakit';
        } else if (leave.type === 'izin') {
            bgClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
            displayCode = 'IZN';
            tooltipText = 'Izin';
        }

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={`relative flex items-center justify-center h-7 rounded text-[9px] font-bold tracking-wide cursor-help transition-all hover:scale-105 ${bgClass} ${today ? 'ring-2 ring-indigo-500 shadow-sm' : ''}`}>
                        {displayCode}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                    <div className="text-xs space-y-0.5">
                        <p className="font-bold">{tooltipText}</p>
                        <p className="opacity-90">{leave.description || 'Tidak ada keterangan'}</p>
                        {shift && <p className="text-[10px] opacity-70 mt-1 line-through">Jadwal asli: {shift.name}</p>}
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    }

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
                    <p className="opacity-90">{shift.start_time} – {shift.end_time}</p>
                    <p className="text-[10px] opacity-80">Tipe: {shift.type === 'steady' ? 'Steady Day' : 'Shift Rotating'}</p>
                    {day.is_exception && <p className="text-[10px] text-amber-300 font-bold mt-1">Jadwal Khusus (Override)</p>}
                </div>
            </TooltipContent>
        </Tooltip>
    );
};

export function RosterGrid({ roster, month_days, isLoading, openExceptionModal }: RosterGridProps) {
    return (
        <div className="rounded-md border overflow-x-auto bg-card relative">
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
                                    className={`px-0.5 py-2 text-center border-r last:border-0 w-[44px] min-w-[44px] ${day.is_weekend
                                        ? 'bg-rose-50/50 dark:bg-rose-950/10'
                                        : ''
                                        } ${today
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
                <tbody className={`divide-y ${isLoading ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
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
                                            className={`px-0.5 py-1.5 text-center border-r last:border-0 cursor-pointer transition-colors hover:bg-muted/80 ${dayMeta?.is_weekend
                                                ? 'bg-rose-50/30 dark:bg-rose-950/5'
                                                : ''
                                                } ${today ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
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
    );
}
