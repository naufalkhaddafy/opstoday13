import { Card, CardContent } from '@/components/ui/card';
import { TicketStatusBadge } from '@/components/shared/TicketStatusBadge';
import { Ticket as TicketIcon } from 'lucide-react';

type TicketItem = {
    id: number;
    ticket_no: string;
    title: string | null;
    category: string | null;
    sub_category: string | null;
    computer_name: string | null;
    requested_for: string | null;
    status: 'assigned' | 'pending_on_hold' | 'in_progress' | 'closed' | null;
    status_label: string | null;
    work_group: string | null;
    first_seen_at: string | null;
    in_progress_at: string | null;
    status_changed_at: string | null;
    disappeared_at: string | null;
    response_time_seconds: number | null;
    response_time_label: string | null;
    api_creation_date: string | null;
    completed_date: string | null;
    resolution_time: string | null;
};

type TicketsTableProps = {
    tickets: TicketItem[];
};

function formatDateTime(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatHours(value: string | null): string {
    if (value === null || value === '' || isNaN(Number(value))) return '-';
    const hours = Number(value);

    if (hours < 1) {
        return `${Math.round(hours * 60)} mnt`;
    }
    if (hours < 24) {
        const whole = Math.floor(hours);
        const minutes = Math.round((hours - whole) * 60);
        return minutes > 0 ? `${whole} jam ${minutes} mnt` : `${whole} jam`;
    }
    const days = Math.floor(hours / 24);
    const restHours = Math.round(hours - days * 24);
    return restHours > 0 ? `${days} hari ${restHours} jam` : `${days} hari`;
}

export function TicketsTable({ tickets }: TicketsTableProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Tiket</th>
                                <th className="px-4 py-3 font-medium">Kategori</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Created</th>
                                <th className="px-4 py-3 font-medium">Response Time</th>
                                <th className="px-4 py-3 font-medium">Completion Date</th>
                                <th className="px-4 py-3 font-medium">Resolution Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        <TicketIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                                        Belum ada tiket untuk user ini.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 align-top">
                                            <div className="font-mono text-xs text-muted-foreground">#{ticket.ticket_no}</div>
                                            <div className="font-medium text-foreground">{ticket.title ?? '-'}</div>
                                            {ticket.requested_for && (
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Untuk: {ticket.requested_for}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div>{ticket.category ?? '-'}</div>
                                            {ticket.sub_category && (
                                                <div className="text-xs text-muted-foreground">{ticket.sub_category}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <TicketStatusBadge status={ticket.status} label={ticket.status_label} />
                                        </td>
                                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                            {ticket.api_creation_date
                                                ? formatDate(ticket.api_creation_date)
                                                : formatDateTime(ticket.first_seen_at)}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {ticket.response_time_label ? (
                                                <span className="font-medium text-foreground">{ticket.response_time_label}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                            {formatDate(ticket.completed_date)}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {ticket.resolution_time ? (
                                                <span className="font-medium text-foreground">
                                                    {formatHours(ticket.resolution_time)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
