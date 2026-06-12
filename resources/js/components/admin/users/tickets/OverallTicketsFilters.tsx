import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Option = {
    id: number;
    name: string;
};

type OverallTicketsFiltersProps = {
    filters: {
        search: string | null;
        company_id: number | null;
        group_id: number | null;
        date_from: string | null;
        date_to: string | null;
        defaults?: {
            date_from: string;
            date_to: string;
        };
    };
    options: {
        companies: Option[];
        groups: Option[];
    };
    navigate: (next: {
        search?: string | null;
        company_id?: number | null;
        group_id?: number | null;
        date_from?: string | null;
        date_to?: string | null;
    }) => void;
};

export function OverallTicketsFilters({ filters, options, navigate }: OverallTicketsFiltersProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

    useEffect(() => {
        setSearchTerm(filters.search ?? '');
    }, [filters.search]);

    const submitSearch = () => {
        navigate({ search: searchTerm.trim() === '' ? null : searchTerm.trim() });
    };

    const clearSearch = () => {
        setSearchTerm('');
        navigate({ search: null });
    };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
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
                        placeholder="Cari no tiket, judul, atau assignee..."
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

                <div className="flex flex-wrap items-center gap-2 flex-1">
                    <Select
                        value={filters.company_id ? filters.company_id.toString() : 'all'}
                        onValueChange={(val) => navigate({ company_id: val === 'all' ? null : parseInt(val, 10) })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Company" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Company</SelectItem>
                            {options.companies.map((opt) => (
                                <SelectItem key={opt.id} value={opt.id.toString()}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.group_id ? filters.group_id.toString() : 'all'}
                        onValueChange={(val) => navigate({ group_id: val === 'all' ? null : parseInt(val, 10) })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Group</SelectItem>
                            {options.groups.map((opt) => (
                                <SelectItem key={opt.id} value={opt.id.toString()}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                        <div className="grid gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal h-10",
                                            !filters.date_from && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.date_from ? (
                                            filters.date_to && filters.date_from !== filters.date_to ? (
                                                <>
                                                    {format(new Date(filters.date_from), "LLL dd, y")} -{" "}
                                                    {format(new Date(filters.date_to), "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(new Date(filters.date_from), "LLL dd, y")
                                            )
                                        ) : (
                                            filters.defaults ? (
                                                <span>
                                                    Bulan Ini ({format(new Date(filters.defaults.date_from), "LLL dd")} - {format(new Date(filters.defaults.date_to), "LLL dd, y")})
                                                </span>
                                            ) : (
                                                <span>Pick a date range</span>
                                            )
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="center">
                                    <Calendar
                                        mode="range"
                                        defaultMonth={filters.date_from ? new Date(filters.date_from) : new Date()}
                                        selected={{
                                            from: filters.date_from ? new Date(filters.date_from) : undefined,
                                            to: filters.date_to ? new Date(filters.date_to) : undefined,
                                        }}
                                        onSelect={(range) => {
                                            if (range?.from) {
                                                const fromDateStr = format(range.from, 'yyyy-MM-dd');
                                                if (range.to) {
                                                    const toDateStr = format(range.to, 'yyyy-MM-dd');
                                                    navigate({ date_from: fromDateStr, date_to: toDateStr });
                                                } else {
                                                    navigate({ date_from: fromDateStr, date_to: fromDateStr });
                                                }
                                            } else {
                                                navigate({
                                                    date_from: filters.defaults?.date_from || null,
                                                    date_to: filters.defaults?.date_to || null
                                                });
                                            }
                                        }}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {(filters.search !== null || filters.company_id !== null || filters.group_id !== null || filters.date_from !== null) && (
                            <>
                                <div className="w-px h-8 bg-border mx-2 hidden sm:block"></div>
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate({
                                        search: null,
                                        company_id: null,
                                        group_id: null,
                                        date_from: null,
                                        date_to: null
                                    })}
                                    className="text-muted-foreground hover:text-foreground shrink-0"
                                >
                                    <X className="mr-2 h-4 w-4" /> Reset
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
