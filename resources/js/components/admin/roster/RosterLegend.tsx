import { HelpCircle, AlertCircle } from 'lucide-react';

export function RosterLegend() {
    return (
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
            <div className="flex items-center gap-1.5 ml-4">
                <span className="h-4 w-7 rounded bg-blue-100 dark:bg-blue-900/40 inline-flex items-center justify-center text-[8px] font-bold text-blue-700 dark:text-blue-300">CTI</span>
                <span>Cuti</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="h-4 w-7 rounded bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 inline-flex items-center justify-center text-[8px] font-bold text-rose-700 dark:text-rose-300">SKT</span>
                <span>Sakit</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="h-4 w-7 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center text-[8px] font-bold text-slate-700 dark:text-slate-300">IZN</span>
                <span>Izin</span>
            </div>
        </div>
    );
}
