import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, CalendarRange } from 'lucide-react';
import { BRAND_ICON_BOX } from '@/lib/brand';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

export default function LeaveIndex({ leaves, filters }: any) {
    const [search, setSearch] = useDebouncedSearch(filters?.search || '');
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(window.location.search);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.get(window.location.pathname, Object.fromEntries(params.entries()), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Pengajuan Cuti" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <CalendarRange className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Daftar Cuti & Sakit</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Kelola pengajuan cuti, izin, dan sakit pegawai.</p>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href="/leaves/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajukan Cuti Baru
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1 md:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Cari nama atau keterangan..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-1 flex-col md:flex-row gap-2">
                                <Select
                                    value={filters?.month || 'all'}
                                    onValueChange={(val) => handleFilterChange('month', val)}
                                >
                                    <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue placeholder="Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Bulan</SelectItem>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filters?.year || 'all'}
                                    onValueChange={(val) => handleFilterChange('year', val)}
                                >
                                    <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue placeholder="Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Tahun</SelectItem>
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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