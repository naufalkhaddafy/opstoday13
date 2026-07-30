import { useCallback, useEffect, useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { DashboardFilters, CompanyOption } from '@/types/dashboard';

const AUTO_REFRESH_INTERVAL_SECONDS = 60;

export function useDashboardFilters(filters: DashboardFilters, companies: CompanyOption[] = []) {
    const [isTicketsLoading, setIsTicketsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);
    const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(AUTO_REFRESH_INTERVAL_SECONDS);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoRefresh) {
            interval = setInterval(() => {
                setAutoRefreshCountdown((prev) => {
                    if (prev <= 1) {
                        router.visit(window.location.href, {
                            only: ['attendance', 'ticket_stats', 'kpi_stats', 'engineers', 'tickets', 'analytics'],
                            preserveScroll: true,
                            preserveState: true,
                        });
                        return AUTO_REFRESH_INTERVAL_SECONDS;
                    }
                    return prev - 1;
                });
            }, 1000); // 1 second tick
        } else {
            setAutoRefreshCountdown(AUTO_REFRESH_INTERVAL_SECONDS);
        }
        return () => clearInterval(interval);
    }, [isAutoRefresh]);

    const isTicketFiltersActive = !!filters.search || !!filters.sort_by || !!filters.status;

    const selectedCompany = useMemo(() => {
        return filters.company_id ? companies.find(c => c.id === filters.company_id)?.name : undefined;
    }, [filters.company_id, companies]);

    const applyFilters = useCallback(
        (next: Partial<DashboardFilters>) => {
            const companyId = next.company_id !== undefined ? next.company_id : filters.company_id;
            const dateFrom = next.date_from ?? filters.date_from;
            const dateTo = next.date_to ?? filters.date_to;
            const search = next.search !== undefined ? next.search : filters.search;
            const workGroup = next.work_group !== undefined ? next.work_group : filters.work_group;
            const sortBy = next.sort_by !== undefined ? next.sort_by : filters.sort_by;
            const sortDir = next.sort_dir !== undefined ? next.sort_dir : filters.sort_dir;
            const status = next.status !== undefined ? next.status : filters.status;

            // If all filters match defaults, navigate to clean URL '/'
            const isDefault =
                !companyId &&
                !workGroup &&
                dateFrom === filters.defaults.date_from &&
                dateTo === filters.defaults.date_to &&
                !search &&
                !sortBy &&
                sortDir === filters.defaults.sort_dir &&
                !status;

            const isTicketOnlyChange =
                (next.search !== undefined || next.sort_by !== undefined || next.sort_dir !== undefined || next.status !== undefined) &&
                next.company_id === undefined &&
                next.work_group === undefined &&
                next.date_from === undefined &&
                next.date_to === undefined;

            const routerOptions: any = {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsTicketsLoading(true),
                onFinish: () => setIsTicketsLoading(false),
            };

            if (isTicketOnlyChange) {
                routerOptions.only = ['tickets', 'filters'];
            }

            if (isDefault) {
                router.get('/', {}, routerOptions);
                return;
            }

            const params: Record<string, string> = {
                date_from: dateFrom,
                date_to: dateTo,
            };
            if (companyId) {
                params.company_id = String(companyId);
            }
            if (workGroup) {
                params.work_group = workGroup;
            }
            if (search) {
                params.search = search;
            }
            if (sortBy) {
                params.sort_by = sortBy;
                params.sort_dir = sortDir;
            }
            if (status) {
                params.status = status;
            }

            router.get('/', params, routerOptions);
        },
        [filters],
    );

    useEffect(() => {
        setSearchQuery(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery !== (filters.search ?? '')) {
                applyFilters({ search: searchQuery || null });
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery, filters.search, applyFilters]);

    const handleTicketFiltersReset = useCallback(() => {
        setSearchQuery('');
        applyFilters({ search: null, sort_by: null, sort_dir: filters.defaults.sort_dir, status: null });
    }, [applyFilters, filters.defaults.sort_dir]);

    const handleSortChange = useCallback((value: string) => {
        if (value === 'default') {
            applyFilters({ sort_by: null, sort_dir: 'desc' });
            return;
        }

        const [sortBy, sortDir] = value.split(':');
        applyFilters({ sort_by: sortBy, sort_dir: sortDir });
    }, [applyFilters]);

    const handleStatusChange = useCallback((value: string) => {
        applyFilters({ status: value === 'all' ? null : value });
    }, [applyFilters]);

    const handleTrendClick = useCallback((phrase: string) => {
        let searchVal = phrase;
        if (phrase.includes(' - ')) {
            searchVal = phrase.split(' - ').pop()?.trim() || phrase;
        } else if (phrase.includes('-')) {
            searchVal = phrase.split('-').pop()?.trim() || phrase;
        }
        setSearchQuery(searchVal);
        document.getElementById('tickets-table-section')?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const handleExport = useCallback(() => {
        setIsExporting(true);
        const params = new URLSearchParams();
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        if (filters.company_id) params.set('company_id', String(filters.company_id));
        if (filters.work_group) params.set('work_group', filters.work_group);
        if (filters.search) params.set('search', filters.search);
        if (filters.status) params.set('status', filters.status);

        window.location.href = `/export?${params.toString()}`;

        // Disable spinner after a few seconds assuming download has started
        setTimeout(() => setIsExporting(false), 3000);
    }, [filters]);

    return {
        searchQuery,
        setSearchQuery,
        isTicketsLoading,
        setIsTicketsLoading,
        isAutoRefresh,
        setIsAutoRefresh,
        autoRefreshCountdown,
        isExporting,
        selectedCompany,
        isTicketFiltersActive,
        applyFilters,
        handleTicketFiltersReset,
        handleSortChange,
        handleStatusChange,
        handleTrendClick,
        handleExport,
    };
}
