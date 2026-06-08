import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Search, FilterX, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GroupController from '@/actions/App/Http/Controllers/Admin/GroupController';
import { useState, useCallback, useEffect } from 'react';
import type { PaginatedGroups } from '@/types';
import { Pagination } from '@/components/shared/Pagination';

type IndexProps = {
    groups: PaginatedGroups;
    filters: {
        search?: string;
    };
};

export default function GroupIndex({ groups, filters }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<{ id: number; name: string } | null>(null);
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
            router.get(GroupController.index().url, query, { preserveState: true, preserveScroll: true, replace: true });
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
        router.get(GroupController.index().url);
    };

    const confirmDelete = (id: number, name: string) => {
        setGroupToDelete({ id, name });
        setDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (groupToDelete) {
            router.delete(GroupController.destroy({ group: groupToDelete.id }).url, {
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setGroupToDelete(null);
                },
            });
        }
    };

    return (
        <>
            <Head title="Manajemen Grup" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Manajemen Grup</CardTitle>
                            <CardDescription>Kelola data grup atau divisi pengguna.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href={GroupController.create().url}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Grup
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama grup..."
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
                                        <th className="px-4 py-3">Nama Grup & Slug</th>
                                        <th className="px-4 py-3 text-center">User</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isLoading ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
                                    {groups.data.length > 0 ? (
                                        groups.data.map((group) => (
                                            <tr key={group.id} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium flex items-center text-foreground">
                                                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {group.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground pl-6">{group.slug}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant="secondary">{group.users_count ?? 0}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <Link href={GroupController.edit({ group: group.id }).url}>
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit Grup</TooltipContent>
                                                        </Tooltip>
                                                        
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => confirmDelete(group.id, group.name)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Hapus Grup</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="h-24 text-center text-muted-foreground">
                                                Tidak ada data grup yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <Pagination links={groups.links} meta={groups.meta} />
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Grup</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus grup <strong>{groupToDelete?.name}</strong>?
                            <br/><br/>
                            <span className="text-destructive font-semibold">Perhatian:</span> Grup tidak dapat dihapus jika masih ada karyawan yang terdaftar pada grup tersebut.
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

GroupIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Grup',
            href: GroupController.index().url,
        },
    ],
};
