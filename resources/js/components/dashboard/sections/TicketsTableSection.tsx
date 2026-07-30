import { Deferred, Link } from '@inertiajs/react';
import { Ticket as TicketIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton } from '@/components/dashboard/Skeletons';
import { TicketStatusBadge } from '@/components/shared/TicketStatusBadge';
import { formatDate } from '@/components/dashboard/helpers';
import { DashboardFilters } from '@/types/dashboard';

interface TicketsTableSectionProps {
    searchQuery: string;
    onSearchQueryChange: (val: string) => void;
    filters: DashboardFilters;
    onSortChange: (val: string) => void;
    onStatusChange: (val: string) => void;
    isTicketFiltersActive: boolean;
    onResetFilters: () => void;
    tickets?: any;
    isTicketsLoading: boolean;
    onStartLoading: () => void;
    onFinishLoading: () => void;
}

export function TicketsTableSection({
    searchQuery,
    onSearchQueryChange,
    filters,
    onSortChange,
    onStatusChange,
    isTicketFiltersActive,
    onResetFilters,
    tickets,
    isTicketsLoading,
    onStartLoading,
    onFinishLoading,
}: TicketsTableSectionProps) {
    return (
        <section id="tickets-table-section" className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <TicketIcon className="h-5 w-5 text-[#2E7D32]" /> Tickets in Period
                </h2>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Input
                        placeholder="Search ticket or engineer..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        className="h-9 w-full bg-white dark:bg-black sm:w-64"
                    />
                    <Select
                        value={filters.sort_by ? `${filters.sort_by}:${filters.sort_dir}` : 'default'}
                        onValueChange={onSortChange}
                    >
                        <SelectTrigger className="h-9 w-full bg-white dark:bg-black sm:w-44">
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
                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={onStatusChange}
                    >
                        <SelectTrigger className="h-9 w-full bg-white dark:bg-black sm:w-36">
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
                    {isTicketFiltersActive && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onResetFilters}
                            className="h-9 px-2 text-xs cursor-pointer text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Reset
                        </Button>
                    )}
                </div>
            </div>
            <Deferred data="tickets" fallback={<TableSkeleton />}>
                {tickets && (
                    isTicketsLoading ? <TableSkeleton /> : (
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                                <th className="px-4 py-3 font-medium">Ticket</th>
                                                <th className="px-4 py-3 font-medium">Category</th>
                                                <th className="px-4 py-3 font-medium">Engineer</th>
                                                <th className="px-4 py-3 font-medium">Resp. Time</th>
                                                <th className="px-4 py-3 font-medium">Res. Time</th>
                                                <th className="px-4 py-3 font-medium">Status</th>
                                                <th className="px-4 py-3 font-medium">Created</th>
                                                <th className="px-4 py-3 font-medium">Completed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                                        <TicketIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                                                        No tickets yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                tickets.data.map((ticket: any, i: number) => (
                                                    <tr key={i} className="group hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="font-semibold text-foreground">{ticket.ticket_no}</div>
                                                            <div className="text-muted-foreground truncate max-w-[200px]" title={ticket.title ?? undefined}>{ticket.title}</div>
                                                            {ticket.requested_for && (
                                                                <div className="mt-0.5 text-xs text-muted-foreground">For: {ticket.requested_for}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-muted-foreground">{ticket.category ?? '-'}</td>
                                                        <td className="px-4 py-3 align-top">{ticket.assigned_user?.name ?? ticket.assigned_to_name ?? '-'}</td>
                                                        <td className="px-4 py-3 align-top font-medium text-foreground">{ticket.response_time_label ?? '-'}</td>
                                                        <td className="px-4 py-3 align-top font-medium text-foreground">{ticket.resolution_time_label ?? '-'}</td>
                                                        <td className="px-4 py-3 align-top">
                                                            <TicketStatusBadge status={ticket.status} label={ticket.status_label} />
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">{formatDate(ticket.created_date)}</td>
                                                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">{formatDate(ticket.completed_date)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {tickets.meta.last_page > 1 && (
                                    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
                                        <p className="text-xs text-muted-foreground">
                                            Showing {tickets.meta.from ?? 0}-{tickets.meta.to ?? 0} of {tickets.meta.total} tickets
                                        </p>
                                        <div className="flex flex-wrap items-center gap-1">
                                            {tickets.links.map((link: any, i: number) =>
                                                link.url ? (
                                                    <Link
                                                        key={i}
                                                        href={link.url}
                                                        preserveScroll
                                                        preserveState
                                                        only={['tickets']}
                                                        onStart={onStartLoading}
                                                        onFinish={onFinishLoading}
                                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${link.active
                                                            ? 'bg-[#2E7D32] text-white'
                                                            : 'border bg-background text-foreground hover:bg-muted'
                                                            }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span
                                                        key={i}
                                                        className="rounded-md px-3 py-1.5 text-xs text-muted-foreground/40"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                )}
            </Deferred>
        </section>
    );
}
