import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Search, FilterX, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ShiftController from '@/actions/App/Http/Controllers/Admin/ShiftController';
import { useState, useCallback, useEffect } from 'react';
import type { PaginatedShifts } from '@/types';
import { Pagination } from '@/components/shared/Pagination';

type IndexProps = {
    shifts: PaginatedShifts;
    filters: {
        search?: string;
    };
};

export default function ShiftIndex({ shifts, filters }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [shiftToDelete, setShiftToDelete] = useState<{ id: number; name: string; code: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Global loading state listener
    useEffect(() => {
        const unbindStart = router.on('start', () => setIsLoading(true));
        const unbindFinish = router.on('finish', () => setIsLoading(false));
        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Apply filters
    const applyFilters = useCallback(
        (newSearch?: string) => {
            const query: Record<string, string> = {};

            const searchVal = newSearch !== undefined ? newSearch : searchTerm;
            if (searchVal) query.search = searchVal;

            router.get(ShiftController.index().url, query, { preserveState: true, preserveScroll: true, replace: true });
        },
        [searchTerm]
    );

    // Handle search input with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== filters.search) {
                applyFilters(searchTerm);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters.search, applyFilters]);

    const clearFilters = () => {
        setSearchTerm('');
        router.get(ShiftController.index().url);
    };

    const confirmDelete = (id: number, name: string, code: string) => {
        setShiftToDelete({ id, name, code });
        setDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (shiftToDelete) {
            router.delete(ShiftController.destroy({ shift: shiftToDelete.id }).url, {
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setShiftToDelete(null);
                },
            });
        }
    };

    return (
        <>
            <Head title="Manajemen Shift" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Manajemen Shift / Jadwal Kerja</CardTitle>
                            <CardDescription>Kelola konfigurasi jam kerja karyawan secara global.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href={ShiftController.create().url}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Shift
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari kode atau nama shift..."
                                    className="pl-8 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {filters.search && (
                                    <Button variant="ghost" size="icon" onClick={clearFilters} title="Hapus Filter">
                                        <FilterX className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="rounded-md border overflow-x-auto relative">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Kode & Nama Shift</th>
                                        <th className="px-4 py-3">Jam Kerja</th>
                                        <th className="px-4 py-3">Tipe</th>
                                        <th className="px-4 py-3 text-center">Ditugaskan</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isLoading ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
                                    {shifts.data.length > 0 ? (
                                        shifts.data.map((shift) => (
                                            <tr key={shift.id} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium flex items-center text-foreground">
                                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {shift.code}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground pl-6">{shift.name}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono">{shift.time_window}</span>
                                                        {shift.is_overnight && (
                                                            <Badge variant="outline" className="text-[10px] h-5">Overnight</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={shift.type === 'steady' ? 'default' : 'secondary'} className="capitalize">
                                                        {shift.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant="outline">{shift.assignments_count}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <Link href={ShiftController.edit({ shift: shift.id }).url}>
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit Shift</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => confirmDelete(shift.id, shift.name, shift.code)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Hapus Shift</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Tidak ada data shift yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <Pagination links={shifts.links} meta={shifts.meta} />
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Shift</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus shift <strong>{shiftToDelete?.code} ({shiftToDelete?.name})</strong>?
                            <br /><br />
                            <span className="text-destructive font-semibold">Perhatian:</span> Shift tidak dapat dihapus jika masih ada karyawan yang ditugaskan pada jam kerja ini.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={executeDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ShiftIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Shift',
            href: ShiftController.index().url,
        },
    ],
};
