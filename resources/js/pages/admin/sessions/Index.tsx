import { Head, router } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MonitorSmartphone, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BRAND_ICON_BOX } from '@/lib/brand';
import AppLayout from '@/layouts/app-layout';

interface Session {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    ip_address: string;
    user_agent: string;
    last_activity_raw: number;
    last_activity_human: string;
    is_current_device: boolean;
}

interface Props {
    sessions: Session[];
}

export default function SessionsIndex({ sessions }: Props) {
    const handleRevoke = (id: string) => {
        router.delete(`/admin/active-sessions/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Active Sessions" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <MonitorSmartphone className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Active Sessions</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Daftar ini ditarik secara real-time dari database sesi. Anda dapat mencabut akses pengguna secara paksa jika terdeteksi aktivitas mencurigakan.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead className="hidden md:table-cell">Browser / Device</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                No active sessions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sessions.map((session) => (
                                            <TableRow key={session.id}>
                                                <TableCell>
                                                    <div className="font-medium">{session.user_name}</div>
                                                    <div className="text-xs text-muted-foreground">{session.user_email}</div>
                                                    {session.is_current_device && (
                                                        <Badge variant="secondary" className="mt-1 text-[10px] uppercase bg-green-100 text-green-700 hover:bg-green-100">
                                                            This Device
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {session.ip_address}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[250px] truncate" title={session.user_agent}>
                                                    {session.user_agent}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{session.last_activity_human}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!session.is_current_device ? (
                                                        <Button 
                                                            variant="destructive" 
                                                            size="sm"
                                                            onClick={() => {
                                                                if (window.confirm(`Anda yakin ingin mencabut akses (logout paksa) sesi untuk pengguna ${session.user_name} dari perangkat dengan IP ${session.ip_address}?`)) {
                                                                    handleRevoke(session.id);
                                                                }
                                                            }}
                                                        >
                                                            <LogOut className="h-4 w-4 mr-2" />
                                                            Revoke
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" disabled>
                                                            Current Session
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SessionsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Active Sessions',
                href: '/admin/active-sessions',
            },
        ]}
    >
        {page}
    </AppLayout>
);
