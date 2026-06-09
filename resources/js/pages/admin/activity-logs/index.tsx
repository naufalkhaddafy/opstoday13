import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Activity, Search, RefreshCw, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { BRAND_ICON_BOX, BRAND_PAGE_HEADER } from '@/lib/brand';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
type ActivityLog = {
    id: number;
    log_name: string;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    causer: {
        id: number;
        name: string;
        email: string;
    } | null;
    properties: Record<string, any>;
    created_at: string;
    created_at_human: string;
};

type Props = {
    logs: {
        data: ActivityLog[];
        links: any[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    filters: {
        search: string | null;
    };
};

export default function ActivityLogsIndex({ logs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = () => {
        setIsLoading(true);
        router.get(
            '/admin/activity-logs',
            { search },
            { preserveState: true, onFinish: () => setIsLoading(false) }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getActionBadgeColor = (description: string) => {
        switch (description) {
            case 'created':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'updated':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'deleted':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <>
            <Head title="Activity Logs" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={BRAND_ICON_BOX}>
                            <Activity className="h-6 w-6 text-brand-500" />
                        </div>
                        <div>
                            <h1 className={BRAND_PAGE_HEADER}>Activity Logs</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Records of all user activities and data changes within the system.
                            </p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-muted-foreground" />
                                Activity History
                            </CardTitle>
                            <div className="flex gap-2">
                                <div className="relative w-full sm:w-64">
                                    <Input
                                        placeholder="Search user, model, or action..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="pl-9"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                                <Button variant="secondary" onClick={handleSearch} disabled={isLoading}>
                                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Time</TableHead>
                                        <TableHead>User (Causer)</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Target (Subject)</TableHead>
                                        <TableHead>Change Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.data.length > 0 ? (
                                        logs.data.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{log.created_at_human}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(log.created_at).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {log.causer ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{log.causer.name}</span>
                                                            <span className="text-xs text-muted-foreground">{log.causer.email}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">System / Guest</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={getActionBadgeColor(log.description)}>
                                                        {log.description.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {log.subject_type ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{log.subject_type}</span>
                                                            <span className="text-xs text-muted-foreground">ID: {log.subject_id}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs md:max-w-md">
                                                        {log.properties?.attributes || log.properties?.old ? (
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="h-8 gap-1">
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                        View Details
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[600px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Change Details</DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4">
                                                                        {log.properties.old && (
                                                                            <div>
                                                                                <h4 className="text-sm font-semibold mb-2 text-red-500">OLD</h4>
                                                                                <div className="bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                                                                    <pre>{JSON.stringify(log.properties.old, null, 2)}</pre>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {log.properties.attributes && (
                                                                            <div>
                                                                                <h4 className="text-sm font-semibold mb-2 text-green-500">NEW</h4>
                                                                                <div className="bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
                                                                                    <pre>{JSON.stringify(log.properties.attributes, null, 2)}</pre>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground italic">No details</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No activity logs found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Pagination controls can be added here using logs.links */}
                        {logs.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {logs.from} to {logs.to} of {logs.total} results
                                </div>
                                <div className="flex gap-1">
                                    {logs.links.map((link, i) => (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            className={`${!link.url ? 'opacity-50 cursor-not-allowed' : ''} ${link.label.includes('Previous') || link.label.includes('Next') ? 'px-2' : ''}`}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ActivityLogsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Activity Logs',
            href: '/admin/activity-logs',
        },
    ],
};
