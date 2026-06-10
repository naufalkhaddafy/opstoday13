import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { verify } from '@/routes/admin/verifications';
import { BRAND_ICON_BOX } from '@/lib/brand';
import { useState, FormEvent } from 'react';
import InputError from '@/components/input-error';

interface Company {
    id: number;
    name: string;
}

interface Group {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    employee_id: string;
    company_id: number | null;
    group_id: number | null;
    company: { name: string } | null;
    group: { name: string } | null;
    created_at: string;
}

interface Props {
    users: User[];
    companies: Company[];
    groups: Group[];
    roles: string[];
}

export default function VerificationIndex({ users, companies, groups, roles }: Props) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        employee_id: '',
        company_id: '',
        group_id: '',
        role: 'engineer',
    });

    const openVerifyModal = (user: User) => {
        setSelectedUser(user);
        setData({
            employee_id: user.employee_id || '',
            company_id: user.company_id ? user.company_id.toString() : '',
            group_id: user.group_id ? user.group_id.toString() : '',
            role: 'engineer',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submitVerify = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        post(verify.url(selectedUser.id), {
            onSuccess: () => {
                toast.success(`Akun ${selectedUser.name} berhasil diverifikasi.`);
                setIsModalOpen(false);
                setSelectedUser(null);
                reset();
            },
        });
    };

    const formatRole = (role: string) => {
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <>
            <Head title="Verifikasi Account" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <Users className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Verifikasi Account</CardTitle>
                                <CardDescription>Daftar akun yang menunggu persetujuan verifikasi Anda.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Karyawan</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Perusahaan</TableHead>
                                        <TableHead>Grup</TableHead>
                                        <TableHead className="w-[150px] text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Tidak ada data yang menunggu verifikasi.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.employee_id}</TableCell>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.company?.name || '-'}</TableCell>
                                                <TableCell>{user.group?.name || '-'}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openVerifyModal(user)}
                                                        className="w-full gap-2"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Cek & Verifikasi
                                                    </Button>
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submitVerify}>
                        <DialogHeader>
                            <DialogTitle>Verifikasi {selectedUser?.name}</DialogTitle>
                            <DialogDescription>
                                Periksa kembali data profil pendaftar sebelum menyetujui.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md flex items-start gap-3 text-amber-800 dark:text-amber-200 text-sm">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p>
                                <strong>Penting:</strong> Pastikan data Badge Number (ID Karyawan) ini terdapat dan cocok dengan yang ada di sistem Attendance dan SiHepi!
                            </p>
                        </div>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="employee_id">Badge Number / ID Karyawan</Label>
                                <Input
                                    id="employee_id"
                                    value={data.employee_id}
                                    onChange={(e) => setData('employee_id', e.target.value)}
                                    required
                                />
                                <InputError message={errors.employee_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="company_id">Perusahaan</Label>
                                <Select
                                    value={data.company_id}
                                    onValueChange={(val) => setData('company_id', val)}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Perusahaan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company) => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.company_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="group_id">Grup / Tim</Label>
                                <Select
                                    value={data.group_id}
                                    onValueChange={(val) => setData('group_id', val)}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Grup" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.map((group) => (
                                            <SelectItem key={group.id} value={group.id.toString()}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.group_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="role">Berikan Role</Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(val) => setData('role', val)}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {formatRole(role)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.role} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Simpan & Verifikasi
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

import { index } from '@/routes/admin/verifications';

VerificationIndex.layout = {
    breadcrumbs: [
        { title: 'Verifikasi Account', href: index.url() },
    ],
};
