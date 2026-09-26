import { Head, router } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, TerminalSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BRAND_ICON_BOX } from '@/lib/brand';

function LogDetailsDialog({ logId, command, children }: { logId: number, command: string, children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && !details) {
            setLoading(true);
            axios.get(`/admin/schedule-logs/${logId}`)
                .then(res => setDetails(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [open, logId, details]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="font-mono text-sm">{command}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Clock className="animate-spin w-8 h-8 text-muted-foreground" /></div>
                    ) : (
                        <>
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Output</h4>
                                <div className="bg-black text-emerald-400 p-4 rounded-md font-mono text-xs whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                    {details?.output || 'No output recorded.'}
                                </div>
                            </div>
                            {details?.metadata && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Metadata</h4>
                                    <div className="bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                        <pre>{JSON.stringify(details.metadata, null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function ScheduleLogsIndex({ logs, filters }: any) {
    const [command, setCommand] = useState(filters.command || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [date, setDate] = useState(filters.date || '');

    const applyFilters = () => {
        router.get('/admin/schedule-logs', { command, status, date }, { preserveState: true });
    };

    const resetFilters = () => {
        setCommand('');
        setStatus('all');
        setDate('');
        router.get('/admin/schedule-logs');
    };

    return (
        <>
            <Head title="Schedule Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <TerminalSquare className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Schedule Logs</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Monitor background scheduled tasks execution.</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div className="space-y-2 flex-1">
                                <label className="text-sm font-medium">Command</label>
                                <Input
                                    placeholder="Filter by command name..."
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                            </div>
                            <div className="space-y-2 flex-1">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="running">Running</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 flex-1">
                                <label className="text-sm font-medium">Date</label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={applyFilters}>Filter</Button>
                                <Button variant="outline" onClick={resetFilters}>Reset</Button>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Command</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Started At</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Output</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No logs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.data.map((log: any) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-mono text-sm">{log.command}</TableCell>
                                                <TableCell>
                                                    {log.status === 'success' && <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Success</Badge>}
                                                    {log.status === 'failed' && <Badge variant="destructive" className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>}
                                                    {log.status === 'running' && <Badge variant="secondary" className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-200"><Clock className="w-3 h-3 mr-1 animate-spin" /> Running</Badge>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{format(new Date(log.started_at), 'MMM dd, yyyy')}</span>
                                                        <span className="text-xs text-muted-foreground">{format(new Date(log.started_at), 'HH:mm:ss')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{log.duration ? `${log.duration} ms` : '-'}</TableCell>
                                                <TableCell>
                                                    <LogDetailsDialog logId={log.id} command={log.command}>
                                                        <Button variant="outline" size="sm" className="h-8 gap-1">
                                                            <TerminalSquare className="h-3.5 w-3.5" />
                                                            View Details
                                                        </Button>
                                                    </LogDetailsDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Simple Pagination */}
                        <div className="mt-4 flex justify-between items-center px-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!logs.prev_page_url}
                                onClick={() => logs.prev_page_url && router.get(logs.prev_page_url)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {logs.current_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!logs.next_page_url}
                                onClick={() => logs.next_page_url && router.get(logs.next_page_url)}
                            >
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ScheduleLogsIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: '/admin/users' },
        { title: 'Schedule Logs', href: '/admin/schedule-logs' },
    ],
};
