import { Link } from '@inertiajs/react';
import { BRAND_LOGO_SRC } from '@/lib/brand';
import { DashboardHeaderFilters } from '@/components/dashboard/DashboardHeaderFilters';
import { formatPeriodLabel } from '@/components/dashboard/helpers';
import { CompanyOption, DashboardFilters } from '@/types/dashboard';

interface StickyFilterBarProps {
    visible: boolean;
    date: string;
    isSingleDay: boolean;
    filters: DashboardFilters;
    companies: CompanyOption[];
    workGroups?: string[];
    selectedCompany?: string;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onApply: (next: Partial<DashboardFilters>) => void;
    onExport: () => void;
    isExporting: boolean;
    isAutoRefresh: boolean;
    autoRefreshCountdown: number;
    onAutoRefreshToggle: () => void;
}

export function StickyFilterBar({
    visible,
    date,
    isSingleDay,
    filters,
    companies,
    workGroups,
    selectedCompany,
    activeTab,
    onTabChange,
    onApply,
    onExport,
    isExporting,
    isAutoRefresh,
    autoRefreshCountdown,
    onAutoRefreshToggle,
}: StickyFilterBarProps) {
    return (
        <div
            className={`sticky top-0 z-30 border-b border-[#1B5E20]/20 bg-white/80 backdrop-blur-lg shadow-sm dark:bg-[#0a0a0a]/80 dark:border-white/10 ${visible ? 'visible opacity-100 transition-opacity duration-300' : 'invisible opacity-0'
                }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:px-8">
                <div className="hidden items-center gap-3 sm:flex">
                    <img src={BRAND_LOGO_SRC} alt="b-hero" className="h-10 w-10 object-contain" />
                    <div className="flex items-center gap-2 border-r border-[#1B5E20]/20 pr-3 mr-1">
                        <p className="text-sm font-semibold text-[#1B5E20] dark:text-emerald-400">
                            {isSingleDay ? date : formatPeriodLabel(filters.date_from, filters.date_to)}
                        </p>
                        <span className="text-muted-foreground/40 text-sm">•</span>
                        <div className="flex bg-muted/50 rounded-md p-0.5">
                            <button
                                onClick={() => onTabChange('service-desk')}
                                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${activeTab === 'service-desk' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Ticket Overview
                            </button>
                            <button
                                onClick={() => onTabChange('team-attendance')}
                                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${activeTab === 'team-attendance' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Team & Attendance
                            </button>
                        </div>
                    </div>
                    {selectedCompany && (
                        <span className="text-sm font-bold text-[#1B5E20] dark:text-emerald-400">
                            {selectedCompany}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <DashboardHeaderFilters
                        companies={companies}
                        workGroups={workGroups}
                        filters={filters}
                        onApply={onApply}
                        onExport={onExport}
                        isExporting={isExporting}
                        isAutoRefresh={isAutoRefresh}
                        autoRefreshCountdown={autoRefreshCountdown}
                        onAutoRefreshToggle={onAutoRefreshToggle}
                        light
                    />
                    <Link
                        href="/dashboard"
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#FDD835]/50 bg-[#FDD835] px-4 text-xs font-semibold text-[#1B5E20] shadow-sm transition-all hover:bg-[#FFEB3B] hover:shadow-md"
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
