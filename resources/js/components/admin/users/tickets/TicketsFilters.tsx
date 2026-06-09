import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Download } from 'lucide-react';

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
    { value: 12, name: 'Desember' },
];

type StatusOption = {
    value: string;
    label: string;
};

type TicketsFiltersProps = {
    filters: {
        status: string | null;
        search: string | null;
        month: number | 'all';
        year: number;
    };
    status_options: StatusOption[];
    navigate: (next: {
        status?: string | null;
        search?: string | null;
        month?: number | 'all';
        year?: number;
    }) => void;
    exportUrl: string;
};

export function TicketsFilters({ filters, status_options, navigate, exportUrl }: TicketsFiltersProps) {
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear - 2; y <= currentYear + 1; y++) {
            years.push(y);
        }
        return years;
    }, []);

    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

    useEffect(() => {
        setSearchTerm(filters.search ?? '');
    }, [filters.search]);

    const handleStatusChange = (value: string) => {
        navigate({ status: value === 'all' ? null : value });
    };

    const handleMonthChange = (value: string) => {
        navigate({ month: value === 'all' ? 'all' : parseInt(value, 10) });
    };

    const handleYearChange = (value: string) => {
        navigate({ year: parseInt(value, 10) });
    };

    const submitSearch = () => {
        navigate({ search: searchTerm.trim() === '' ? null : searchTerm.trim() });
    };

    const clearSearch = () => {
        setSearchTerm('');
        navigate({ search: null });
    };

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
            <div className="relative w-full lg:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            submitSearch();
                        }
                    }}
                    placeholder="Cari no tiket atau judul..."
                    className="pl-9 pr-9"
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                        title="Hapus pencarian"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Select value={filters.month === 'all' ? 'all' : filters.month.toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Bulan</SelectItem>
                        {MONTH_NAMES.map((m) => (
                            <SelectItem key={m.value} value={m.value.toString()}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.year.toString()}
                    onValueChange={handleYearChange}
                    disabled={filters.month === 'all'}
                >
                    <SelectTrigger className="w-[110px]">
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

                <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Semua status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        {status_options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
