import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Search, FilterX, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ShiftController from '@/actions/App/Http/Controllers/Admin/ShiftController';
import { useState, useCallback, useEffect } from 'react';
import type { PaginatedShifts, AdminCompany } from '@/types';

type IndexProps = {
    shifts: PaginatedShifts;
    companies: AdminCompany[];
    filters: {
        search?: string;
        company_id?: string;
    };
};

export default function ShiftIndex({ shifts, companies, filters }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [companyFilter, setCompanyFilter] = useState<string>(filters.company_id || 'all');
    
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [shiftToDelete, setShiftToDelete] = useState<{ id: number; name: string; code: string } | null>(null);

    // Apply filters
    const applyFilters = useCallback(
        (newSearch?: string, newCompany?: string) => {
            const query: Record<string, string> = {};
            
            const searchVal = newSearch !== undefined ? newSearch : searchTerm;
            if (searchVal) query.search = searchVal;
            
            const companyVal = newCompany !== undefined ? newCompany : companyFilter;
            if (companyVal && companyVal !== 'all') query.company_id = companyVal;
            
            router.get(ShiftController.index().url, query, { preserveState: true, preserveScroll: true, replace: true });
        },
        [searchTerm, companyFilter]
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

    const handleCompanyChange = (value: string) => {
        setCompanyFilter(value);
        applyFilters(undefined, value);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setCompanyFilter('all');
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
                            <CardDescription>Kelola konfigurasi jam kerja karyawan berdasarkan cabang perusahaan.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href={ShiftController.create().url}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Shift
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1 sm:max-w-md">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari kode atau nama shift..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={companyFilter} onValueChange={handleCompanyChange}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Semua Perusahaan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Perusahaan</SelectItem>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={company.id.toString()}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex flex-1 gap-2">
                                {(filters.search || filters.company_id) && (
                                    <Button variant="ghost" size="icon" onClick={clearFilters} title="Hapus Filter">
                                        <FilterX className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Kode & Nama Shift</th>
                                        <th className="px-4 py-3">Perusahaan / Cabang</th>
                                        <th className="px-4 py-3">Jam Kerja</th>
                                        <th className="px-4 py-3">Tipe</th>
                                        <th className="px-4 py-3 text-center">Ditugaskan</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
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
                                                    {shift.company ? shift.company.name : <span className="text-muted-foreground italic">Tidak ada</span>}
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
                                            <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                                Tidak ada data shift yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {shifts.meta.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {shifts.meta.from || 0} hingga {shifts.meta.to || 0} dari {shifts.meta.total} hasil
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!shifts.links.prev}
                                        onClick={() => shifts.links.prev && router.get(shifts.links.prev)}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!shifts.links.next}
                                        onClick={() => shifts.links.next && router.get(shifts.links.next)}
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            </div>
                        )}
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
                            <br/><br/>
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
