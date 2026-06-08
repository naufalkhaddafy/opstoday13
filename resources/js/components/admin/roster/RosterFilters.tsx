import { Search, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo } from 'react';

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

type RosterFiltersProps = {
    month: number;
    year: number;
    searchTerm: string;
    companyFilter: string;
    groupFilter: string;
    companies: { id: number; name: string }[];
    groups: { id: number; name: string }[];
    filters: { search?: string; company_id?: string; group_id?: string };
    setSearchTerm: (val: string) => void;
    handleCompanyChange: (val: string) => void;
    handleGroupChange: (val: string) => void;
    handleMonthChange: (val: string) => void;
    handleYearChange: (val: string) => void;
    navigateMonth: (delta: number) => void;
    goToCurrentMonth: () => void;
    resetFilters: () => void;
};

export function RosterFilters({
    month,
    year,
    searchTerm,
    companyFilter,
    groupFilter,
    companies,
    groups,
    filters,
    setSearchTerm,
    handleCompanyChange,
    handleGroupChange,
    handleMonthChange,
    handleYearChange,
    navigateMonth,
    goToCurrentMonth,
    resetFilters,
}: RosterFiltersProps) {
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear - 3; y <= currentYear + 1; y++) {
            years.push(y);
        }
        return years;
    }, []);

    const hasFilters = filters.search || (filters.company_id && filters.company_id !== 'all') || (filters.group_id && filters.group_id !== 'all');

    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            {/* Month/Year Navigation */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)} title="Bulan Sebelumnya" className="h-8 w-8">
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

                <Button variant="outline" size="icon" onClick={() => navigateMonth(1)} title="Bulan Selanjutnya" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="sm" onClick={goToCurrentMonth} className="h-8 text-xs">
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

                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} title="Reset Filter" className="h-8 px-2">
                        <FilterX className="h-4 w-4 mr-1" /> Reset
                    </Button>
                )}
            </div>
        </div>
    );
}
