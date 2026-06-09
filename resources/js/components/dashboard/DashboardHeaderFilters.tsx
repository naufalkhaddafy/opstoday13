import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, SlidersHorizontal, X, Building2, CalendarClock, TicketIcon, RefreshCw } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CompanyOption, DashboardFilters } from '@/types/dashboard';

export function DashboardHeaderFilters({
    companies,
    filters,
    onApply,
    onExport,
    isAutoRefresh,
    autoRefreshCountdown,
    onAutoRefreshToggle,
    light = false,
}: {
    companies: CompanyOption[];
    filters: DashboardFilters;
    onApply: (next: Partial<DashboardFilters>) => void;
    onExport: () => void;
    isAutoRefresh?: boolean;
    autoRefreshCountdown?: number;
    onAutoRefreshToggle?: () => void;
    light?: boolean;
}) {
    const [open, setOpen] = useState(false);

    const isFiltered =
        filters.company_id !== filters.defaults.company_id ||
        filters.date_from !== filters.defaults.date_from ||
        filters.date_to !== filters.defaults.date_to ||
        filters.search !== filters.defaults.search ||
        filters.sort_by !== filters.defaults.sort_by ||
        filters.sort_dir !== filters.defaults.sort_dir ||
        filters.status !== filters.defaults.status;

    const btnClasses = light
        ? 'h-9 gap-2 rounded-md border border-[#1B5E20]/20 px-3 text-xs font-semibold shadow-sm transition-all cursor-pointer'
        : 'h-9 gap-2 rounded-md border border-white/20 px-3 text-xs font-semibold shadow-sm backdrop-blur-sm transition-all cursor-pointer';

    const handleReset = () => {
        onApply({
            company_id: null,
            date_from: filters.defaults.date_from,
            date_to: filters.defaults.date_to,
            search: null,
            sort_by: null,
            sort_dir: filters.defaults.sort_dir,
            status: null,
        });
        setOpen(false);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                {onAutoRefreshToggle && (
                    <Button
                        type="button"
                        variant={isAutoRefresh ? 'default' : 'outline'}
                        onClick={onAutoRefreshToggle}
                        className={`${btnClasses} ${
                            isAutoRefresh
                                ? 'bg-[#2E7D32] text-white hover:bg-[#1B5E20] border-[#2E7D32] min-w-[90px]'
                                : light
                                    ? 'bg-white text-[#1B5E20] hover:bg-green-50 hover:shadow-md min-w-[90px]'
                                    : 'bg-white/95 text-[#1B5E20] hover:bg-white hover:shadow-md min-w-[90px]'
                        }`}
                        title={isAutoRefresh ? "Auto Refresh is ON (every 1m)" : "Auto Refresh is OFF"}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isAutoRefresh ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">
                            {isAutoRefresh && autoRefreshCountdown !== undefined ? `Auto (${autoRefreshCountdown}s)` : 'Auto'}
                        </span>
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    onClick={onExport}
                    className={`${btnClasses} ${light ? 'bg-white text-[#1B5E20] hover:bg-green-50 hover:shadow-md' : 'bg-white/95 text-[#1B5E20] hover:bg-white hover:shadow-md'}`}
                >
                    <Download className="h-3.5 w-3.5 text-[#2E7D32]" />
                    <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(true)}
                    className={`${btnClasses} ${isFiltered
                        ? light
                            ? 'border-[#B8860B]/40 bg-[#FDD835]/20 text-[#7B6C00] hover:bg-[#FDD835]/30'
                            : 'border-[#FDD835]/40 bg-[#FDD835]/20 text-[#FDD835] hover:bg-[#FDD835]/30'
                        : light
                            ? 'bg-[#1B5E20]/10 text-[#1B5E20] hover:bg-[#1B5E20]/20'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {isFiltered ? 'Filtered' : 'Filters'}
                </Button>
                {isFiltered && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleReset}
                        className={`h-9 px-2 text-xs cursor-pointer ${light ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-700' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                    >
                        <X className="h-3.5 w-3.5" />
                        Reset
                    </Button>
                )}
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-[340px] sm:max-w-[380px]">
                    <SheetHeader className="border-b pb-4">
                        <SheetTitle className="flex items-center gap-2 text-lg">
                            <SlidersHorizontal className="h-5 w-5 text-[#2E7D32]" />
                            Dashboard Filters
                        </SheetTitle>
                        <SheetDescription>
                            Filter data by company and date range.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                        {/* Company */}
                        <div className="space-y-2">
                            <Label htmlFor="company-filter" className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Building2 className="h-4 w-4 text-[#2E7D32]" /> Company
                            </Label>
                            <Select
                                value={filters.company_id ? String(filters.company_id) : 'all'}
                                onValueChange={(value) => onApply({ company_id: value === 'all' ? null : Number(value) })}
                            >
                                <SelectTrigger id="company-filter" className="h-10 w-full">
                                    <SelectValue placeholder="All companies" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All companies</SelectItem>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={String(company.id)}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date range */}
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <CalendarClock className="h-4 w-4 text-[#2E7D32]" /> Date Range
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="filter-date-from" className="text-xs text-muted-foreground">From</Label>
                                    <Input
                                        id="filter-date-from"
                                        type="date"
                                        className="h-10"
                                        value={filters.date_from}
                                        onChange={(e) => onApply({ date_from: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="filter-date-to" className="text-xs text-muted-foreground">To</Label>
                                    <Input
                                        id="filter-date-to"
                                        type="date"
                                        className="h-10"
                                        value={filters.date_to}
                                        onChange={(e) => onApply({ date_to: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ticket Filtering */}
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <TicketIcon className="h-4 w-4 text-[#2E7D32]" /> Ticket Filters
                            </Label>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Sort By</Label>
                                    <Select
                                        value={filters.sort_by ? `${filters.sort_by}:${filters.sort_dir}` : 'default'}
                                        onValueChange={(value) => {
                                            if (value === 'default') {
                                                onApply({ sort_by: null, sort_dir: 'desc' });
                                            } else {
                                                const [sortBy, sortDir] = value.split(':');
                                                onApply({ sort_by: sortBy, sort_dir: sortDir });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-10 w-full">
                                            <SelectValue placeholder="Sort By" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Sort: Default</SelectItem>
                                            <SelectItem value="response_time:asc">Resp. Time (Fastest)</SelectItem>
                                            <SelectItem value="response_time:desc">Resp. Time (Slowest)</SelectItem>
                                            <SelectItem value="resolution_time:asc">Res. Time (Fastest)</SelectItem>
                                            <SelectItem value="resolution_time:desc">Res. Time (Slowest)</SelectItem>
                                            <SelectItem value="created_date:asc">Created (Asc)</SelectItem>
                                            <SelectItem value="created_date:desc">Created (Desc)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <Select
                                        value={filters.status ?? 'all'}
                                        onValueChange={(value) => onApply({ status: value === 'all' ? null : value })}
                                    >
                                        <SelectTrigger className="h-10 w-full">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="assigned">Assigned</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="pending_on_hold">Pending/On Hold</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Active filter indicator */}
                        {isFiltered && (
                            <div className="rounded-lg border border-[#FDD835]/30 bg-[#FDD835]/5 p-3">
                                <p className="text-xs text-muted-foreground">
                                    Filters are active. Data is filtered
                                    {filters.company_id ? ' by company' : ''}
                                    {filters.date_from !== filters.defaults.date_from || filters.date_to !== filters.defaults.date_to
                                        ? ` for ${filters.date_from} – ${filters.date_to}`
                                        : ''}
                                    {filters.search || filters.sort_by || filters.status ? ' and ticket filters' : ''}.
                                </p>
                            </div>
                        )}
                    </div>

                    <SheetFooter className="border-t pt-4">
                        {isFiltered && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                className="w-full gap-2"
                            >
                                <X className="h-4 w-4" />
                                Reset to Today
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="w-full gap-2 bg-[#2E7D32] text-white hover:bg-[#1B5E20]"
                        >
                            Done
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
