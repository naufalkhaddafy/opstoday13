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
import type { AdminCompany, User } from '@/types';

type EditProps = {
    user: User;
    companies: AdminCompany[];
    roles: string[];
};

export default function UserEdit({ user, companies, roles }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        employee_id: user.employee_id || '',
        role: user.role || '',
        company_id: user.company?.id?.toString() || 'none',
        is_active: user.is_active,
        is_verified: user.is_verified,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Remove company_id if 'none' before sending
        const payload = { ...data };
        if (payload.company_id === 'none') {
            payload.company_id = '';
        }

        put(UserController.update({ user: user.id }).url);
    };

    const formatRole = (role: string) => {
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <>
            <Head title={`Edit User: ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-3xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Edit Data User</CardTitle>
                            <CardDescription>Perbarui informasi profil dan hak akses untuk {user.name}.</CardDescription>
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
                                    
                                    <div className="pt-2 text-sm text-muted-foreground border-t mt-4 pt-4">
                                        <p>Info: Ubah password hanya dapat dilakukan oleh pengguna langsung dari halaman Profil akun mereka.</p>
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
                                                Email Terverifikasi
                                            </Label>
                                        </div>
                                        <InputError message={errors.is_verified} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t mt-6">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UserEdit.layout = {
    breadcrumbs: [
        { title: 'Manajemen User', href: UserController.index().url },
        { title: 'Edit User', href: '#' }
    ]
};


