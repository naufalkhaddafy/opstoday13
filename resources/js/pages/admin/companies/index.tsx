import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Search, FilterX, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CompanyController from '@/actions/App/Http/Controllers/Admin/CompanyController';
import { useState, useCallback, useEffect } from 'react';
import type { PaginatedCompanies } from '@/types';

type IndexProps = {
    companies: PaginatedCompanies;
    filters: {
        search?: string;
    };
};

export default function CompanyIndex({ companies, filters }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<{ id: number; name: string } | null>(null);

    // Apply filters
    const applyFilters = useCallback(
        (newSearch?: string) => {
            const query: Record<string, string> = {};
            
            const searchVal = newSearch !== undefined ? newSearch : searchTerm;
            if (searchVal) query.search = searchVal;
            
            router.get(CompanyController.index().url, query, { preserveState: true, preserveScroll: true, replace: true });
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
        router.get(CompanyController.index().url);
    };

    const confirmDelete = (id: number, name: string) => {
        setCompanyToDelete({ id, name });
        setDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (companyToDelete) {
            router.delete(CompanyController.destroy({ company: companyToDelete.id }).url, {
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setCompanyToDelete(null);
                },
            });
        }
    };

    return (
        <>
            <Head title="Manajemen Perusahaan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Manajemen Perusahaan</CardTitle>
                            <CardDescription>Kelola data perusahaan cabang dan pusat operasional.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href={CompanyController.create().url}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Perusahaan
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1 sm:max-w-md">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama atau slug perusahaan..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-1 gap-2">
                                {filters.search && (
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
                                        <th className="px-4 py-3">Nama Perusahaan & Slug</th>
                                        <th className="px-4 py-3">No. WhatsApp Group</th>
                                        <th className="px-4 py-3 text-center">User</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.data.length > 0 ? (
                                        companies.data.map((company) => (
                                            <tr key={company.id} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium flex items-center text-foreground">
                                                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {company.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground pl-6">{company.slug}</div>
                                                </td>
                                                <td className="px-4 py-3">{company.whatsapp_group_number || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant="secondary">{company.users_count}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <Link href={CompanyController.edit({ company: company.id }).url}>
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit Perusahaan</TooltipContent>
                                                        </Tooltip>
                                                        
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => confirmDelete(company.id, company.name)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Hapus Perusahaan</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="h-24 text-center text-muted-foreground">
                                                Tidak ada data perusahaan yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {companies.meta.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {companies.meta.from || 0} hingga {companies.meta.to || 0} dari {companies.meta.total} hasil
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!companies.links.prev}
                                        onClick={() => companies.links.prev && router.get(companies.links.prev)}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!companies.links.next}
                                        onClick={() => companies.links.next && router.get(companies.links.next)}
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
                        <DialogTitle>Hapus Perusahaan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus perusahaan <strong>{companyToDelete?.name}</strong>?
                            <br/><br/>
                            <span className="text-destructive font-semibold">Perhatian:</span> Perusahaan tidak dapat dihapus jika masih ada karyawan yang terdaftar pada perusahaan tersebut.
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

CompanyIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Perusahaan',
            href: CompanyController.index().url,
        },
    ],
};
