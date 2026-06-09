import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

type AttendanceFiltersProps = {
    filters: {
        month: number;
        year: number;
    };
    currentMonthName: string;
    handleFilterChange: (key: 'month' | 'year', value: string) => void;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    exportUrl: string;
};

export function AttendanceFilters({
    filters,
    currentMonthName,
    handleFilterChange,
    handlePrevMonth,
    handleNextMonth,
    exportUrl
}: AttendanceFiltersProps) {
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear - 2; y <= currentYear + 1; y++) {
            years.push(y);
        }
        return years;
    }, []);

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} title="Bulan Sebelumnya">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold text-center min-w-[160px] text-foreground">
                    {currentMonthName} {filters.year}
                </h2>
                <Button variant="outline" size="icon" onClick={handleNextMonth} title="Bulan Berikutnya">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Select
                    value={filters.month.toString()}
                    onValueChange={(val) => handleFilterChange('month', val)}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        {MONTH_NAMES.map((m) => (
                            <SelectItem key={m.value} value={m.value.toString()}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.year.toString()}
                    onValueChange={(val) => handleFilterChange('year', val)}
                >
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                        {yearOptions.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="w-px h-8 bg-border mx-2 hidden sm:block"></div>
                <Button variant="outline" asChild className="shrink-0 group">
                    <a href={exportUrl} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" /> Export Excel
                    </a>
                </Button>
            </div>
        </div>
    );
}
