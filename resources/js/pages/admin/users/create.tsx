import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import type { AdminCompany } from '@/types';

type CreateProps = {
    companies: AdminCompany[];
    roles: string[];
};

export default function UserCreate({ companies, roles }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        employee_id: '',
        password: '',
        password_confirmation: '',
        role: '',
        company_id: '',
        is_active: true,
        is_verified: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(UserController.store().url);
    };

    const formatRole = (role: string) => {
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <>
            <Head title="Tambah User" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-3xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Tambah User Baru</CardTitle>
                            <CardDescription>Buat akun pengguna baru dalam sistem.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={UserController.index().url}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Personal Data */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium border-b pb-2">Informasi Profil</h3>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lengkap <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            autoComplete="name"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Alamat Email <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            autoComplete="username"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="employee_id">Employee ID (Opsional)</Label>
                                        <Input
                                            id="employee_id"
                                            value={data.employee_id}
                                            onChange={(e) => setData('employee_id', e.target.value)}
                                        />
                                        <InputError message={errors.employee_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Konfirmasi Password <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>
                                </div>

                                {/* Right Column: Role & Config */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium border-b pb-2">Akses & Perusahaan</h3>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role / Peran <span className="text-destructive">*</span></Label>
                                        <Select 
                                            value={data.role} 
                                            onValueChange={(value) => setData('role', value)}
                                            required
                                        >
                                            <SelectTrigger id="role">
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

                                    <div className="space-y-2">
                                        <Label htmlFor="company_id">Perusahaan (Opsional)</Label>
                                        <Select 
                                            value={data.company_id} 
                                            onValueChange={(value) => setData('company_id', value)}
                                        >
                                            <SelectTrigger id="company_id">
                                                <SelectValue placeholder="Pilih Perusahaan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Tidak ada (Kosong)</SelectItem>
                                                {companies.map((company) => (
                                                    <SelectItem key={company.id} value={company.id.toString()}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.company_id} />
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="is_active" 
                                                checked={data.is_active}
                                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                            />
                                            <Label htmlFor="is_active" className="cursor-pointer font-normal">
                                                User Aktif (Dapat login ke sistem)
                                            </Label>
                                        </div>
                                        <InputError message={errors.is_active} />

                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="is_verified" 
                                                checked={data.is_verified}
                                                onCheckedChange={(checked) => setData('is_verified', checked as boolean)}
                                            />
                                            <Label htmlFor="is_verified" className="cursor-pointer font-normal">
                                                Email Terverifikasi (Bypass email verification link)
                                            </Label>
                                        </div>
                                        <InputError message={errors.is_verified} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t mt-6">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Simpan Pengguna Baru
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UserCreate.layout = {
    breadcrumbs: [
        { title: 'Manajemen User', href: UserController.index().url },
        { title: 'Tambah User', href: UserController.create().url }
    ],
};

