import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function LeaveIndex({ leaves, filters }: any) {
    return (
        <>
            <Head title="Pengajuan Cuti" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Daftar Cuti & Sakit</h2>
                        <p className="text-muted-foreground">Kelola pengajuan cuti, izin, dan sakit pegawai.</p>
                    </div>

                    <Button asChild>
                        <Link href="/leaves/create">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajukan Cuti Baru
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Data Pengajuan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1 md:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Cari (Belum Tersedia)..."
                                    className="pl-8"
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Pegawai</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Jenis</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Tanggal Mulai</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Tanggal Selesai</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Keterangan</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {leaves.data.length === 0 ? (
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td colSpan={6} className="p-2 align-middle h-24 text-center">
                                                Tidak ada data pengajuan cuti.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.data.map((leave: any) => (
                                            <tr key={leave.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-2 align-middle font-medium">
                                                    {leave.user?.name || '-'}
                                                </td>
                                                <td className="p-2 align-middle">
                                                    <Badge variant={leave.type === 'sakit' ? 'destructive' : leave.type === 'izin' ? 'secondary' : 'default'}>
                                                        {leave.type.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="p-2 align-middle">{leave.start_date}</td>
                                                <td className="p-2 align-middle">{leave.end_date}</td>
                                                <td className="p-2 align-middle max-w-[200px] truncate">
                                                    {leave.description || '-'}
                                                </td>
                                                <td className="p-2 align-middle">
                                                    <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'rejected' ? 'destructive' : 'outline'}>
                                                        {leave.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

LeaveIndex.layout = {
    breadcrumbs: [
        {
            title: 'Pengajuan Cuti',
            href: '#',
        },
    ],
};