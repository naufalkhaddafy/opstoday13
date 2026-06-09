import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Search, FilterX, Calendar, Ticket, Users } from 'lucide-react';
import { BRAND_ICON_BOX } from '@/lib/brand';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { useState, useCallback, useEffect } from 'react';
import type { PaginatedUsers, AdminCompany } from '@/types';
import { Pagination } from '@/components/shared/Pagination';

type IndexProps = {
    users: PaginatedUsers;
    companies: AdminCompany[];
    groups: { id: number; name: string }[];
    roles: string[];
    filters: {
        search?: string;
        role?: string;
        company_id?: string;
        group_id?: string;
    };
};

export default function UserIndex({ users, companies, groups, roles, filters }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
    const [companyFilter, setCompanyFilter] = useState(filters.company_id || 'all');
    const [groupFilter, setGroupFilter] = useState(filters.group_id || 'all');
    
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
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
        (newSearch?: string, newRole?: string, newCompany?: string, newGroup?: string) => {
            const query: Record<string, string> = {};
            
            const searchVal = newSearch !== undefined ? newSearch : searchTerm;
            if (searchVal) query.search = searchVal;
            
            const roleVal = newRole !== undefined ? newRole : roleFilter;
            if (roleVal !== 'all') query.role = roleVal;
            
            const companyVal = newCompany !== undefined ? newCompany : companyFilter;
            if (companyVal !== 'all') query.company_id = companyVal;

            const groupVal = newGroup !== undefined ? newGroup : groupFilter;
            if (groupVal !== 'all') query.group_id = groupVal;

            router.get(UserController.index().url, query, { preserveState: true, preserveScroll: true, replace: true });
        },
        [searchTerm, roleFilter, companyFilter, groupFilter]
    );

    // Handle search input with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== filters.search) {
                applyFilters(searchTerm, undefined, undefined, undefined);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters.search, applyFilters]);

    const handleRoleChange = (value: string) => {
        setRoleFilter(value);
        applyFilters(undefined, value, undefined, undefined);
    };

    const handleCompanyChange = (value: string) => {
        setCompanyFilter(value);
        applyFilters(undefined, undefined, value, undefined);
    };

    const handleGroupChange = (value: string) => {
        setGroupFilter(value);
        applyFilters(undefined, undefined, undefined, value);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setRoleFilter('all');
        setCompanyFilter('all');
        setGroupFilter('all');
        router.get(UserController.index().url);
    };

    const confirmDelete = (id: number, name: string) => {
        setUserToDelete({ id, name });
        setDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (userToDelete) {
            router.delete(UserController.destroy({ user: userToDelete.id }).url, {
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setUserToDelete(null);
                },
            });
        }
    };

    const formatRole = (role: string | null) => {
        if (!role) return '-';
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatDaysOfWeek = (days: number[] | null) => {
        if (!days || days.length === 0) return 'Semua hari';
        if (days.length === 7) return 'Setiap hari';
        
        const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const sortedDays = [...days].sort((a, b) => a - b);
        
        const isConsecutive = sortedDays.every((d, i) => i === 0 || d === sortedDays[i - 1] + 1);
        if (isConsecutive && sortedDays.length > 2) {
            return `${dayNames[sortedDays[0] - 1]} - ${dayNames[sortedDays[sortedDays.length - 1] - 1]}`;
        }
        
        return sortedDays.map(d => dayNames[d - 1]).join(', ');
    };

    return (
        <>
            <Head title="Manajemen User" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b mb-6">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <Users className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Manajemen User</CardTitle>
                                <CardDescription>Kelola data pengguna, peran, dan akses sistem.</CardDescription>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href={UserController.create().url}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah User
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama, email, atau ID karyawan..."
                                    className="pl-8 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Select value={roleFilter} onValueChange={handleRoleChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Role</SelectItem>
                                        {roles.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {formatRole(role)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={companyFilter} onValueChange={handleCompanyChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Perusahaan" />
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

                                <Select value={groupFilter} onValueChange={handleGroupChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Grup" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Grup</SelectItem>
                                        {groups.map((group) => (
                                            <SelectItem key={group.id} value={group.id.toString()}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(filters.search || filters.role || filters.company_id || filters.group_id) && (
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
                                        <th className="px-4 py-3">Nama & Email</th>
                                        <th className="px-4 py-3">Employee ID</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Perusahaan & Grup</th>
                                        <th className="px-4 py-3">Shift & Hari</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isLoading ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
                                    {users.data.length > 0 ? (
                                        users.data.map((user) => (
                                            <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-foreground">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </td>
                                                <td className="px-4 py-3">{user.employee_id || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">{formatRole(user.role)}</Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-foreground">{user.company?.name || '-'}</div>
                                                    <div className="text-xs text-muted-foreground">{user.group?.name || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {user.active_assignment?.shift ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="font-medium text-foreground">
                                                                {user.active_assignment.shift.name} ({user.active_assignment.shift.code})
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatDaysOfWeek(user.active_assignment.days_of_week)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-[10px] px-1 py-0 h-4">
                                                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </Badge>
                                                        {user.is_verified && (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
                                                                Verified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#2E7D32] hover:text-[#1B5E20] hover:bg-green-50 dark:text-[#4CAF50] dark:hover:text-green-300 dark:hover:bg-green-950/40" asChild>
                                                                    <Link href={UserController.attendance({ user: user.id }).url}>
                                                                        <Calendar className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Lihat Absensi & KPI</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/40" asChild>
                                                                    <Link href={UserController.tickets({ user: user.id }).url}>
                                                                        <Ticket className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Report Tiket</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <Link href={UserController.edit({ user: user.id }).url}>
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit Data</TooltipContent>
                                                        </Tooltip>
                                                        
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => confirmDelete(user.id, user.name)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Hapus User</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="h-24 text-center text-muted-foreground">
                                                Tidak ada data pengguna yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <Pagination links={users.links} meta={users.meta} />
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Pengguna</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus pengguna <strong>{userToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

UserIndex.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen User',
            href: UserController.index().url,
        },
    ],
};

