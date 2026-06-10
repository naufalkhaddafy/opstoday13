import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, CalendarRange, Pencil, Trash2 } from 'lucide-react';
import { BRAND_ICON_BOX } from '@/lib/brand';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, FormEvent } from 'react';
import InputError from '@/components/input-error';

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
    const { auth } = usePage().props as any;
    const isEngineer = auth.user.role === 'engineer';
    
    const [search, setSearch] = useDebouncedSearch(filters?.search || '');
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    // Modal States
    const [editLeave, setEditLeave] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteLeave, setDeleteLeave] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { data, setData, put, processing: isUpdating, errors, clearErrors, reset } = useForm({
        user_id: '',
        type: '',
        start_date: '',
        end_date: '',
        description: '',
        status: '',
    });

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

    const openEditModal = (leave: any) => {
        setEditLeave(leave);
        setData({
            user_id: leave.user_id ? leave.user_id.toString() : '',
            type: leave.type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            description: leave.description || '',
            status: leave.status || 'approved',
        });
        clearErrors();
        setIsEditModalOpen(true);
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editLeave) return;

        put(`/leaves/${editLeave.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditLeave(null);
                reset();
            },
        });
    };

    const openDeleteModal = (leave: any) => {
        setDeleteLeave(leave);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (!deleteLeave) return;
        
        router.delete(`/leaves/${deleteLeave.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeleteLeave(null);
            },
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
                                        <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {leaves.data.length === 0 ? (
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td colSpan={7} className="p-2 align-middle h-24 text-center">
                                                Tidak ada data pengajuan cuti.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.data.map((leave: any) => {
                                            return (
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
                                                    <td className="p-2 align-middle text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => openEditModal(leave)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => openDeleteModal(leave)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit Pengajuan Cuti</DialogTitle>
                            <DialogDescription>
                                Perbarui data cuti untuk {editLeave?.user?.name}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Jenis Pengajuan</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(val) => setData('type', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cuti">Cuti Tahunan</SelectItem>
                                        <SelectItem value="sakit">Sakit</SelectItem>
                                        <SelectItem value="izin">Izin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">Tanggal Mulai</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.start_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">Tanggal Selesai</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Keterangan</Label>
                                <textarea
                                    id="description"
                                    placeholder="Opsional. Masukkan alasan atau keterangan..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>

                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Pengajuan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus pengajuan {deleteLeave?.type} dari <strong>{deleteLeave?.user?.name}</strong> (Tanggal: {deleteLeave?.start_date})? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={executeDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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