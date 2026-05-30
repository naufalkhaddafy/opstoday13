import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, CalendarClock } from 'lucide-react';
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
    groups: { id: number; name: string }[];
    shifts: { id: number; name: string; code: string }[];
    roles: string[];
};

const DAY_NAMES = [
    { id: 1, name: 'Senin' },
    { id: 2, name: 'Selasa' },
    { id: 3, name: 'Rabu' },
    { id: 4, name: 'Kamis' },
    { id: 5, name: 'Jumat' },
    { id: 6, name: 'Sabtu' },
    { id: 7, name: 'Minggu' },
];

export default function UserCreate({ companies, groups, shifts, roles }: CreateProps) {
    const { data, setData, post, processing, errors, transform } = useForm({
        name: '',
        email: '',
        employee_id: '',
        password: '',
        password_confirmation: '',
        role: '',
        company_id: '',
        group_id: '',
        is_active: true,
        is_verified: false,
        // Shift Assignment
        shift_schedule: {
            1: '',
            2: '',
            3: '',
            4: '',
            5: '',
            6: '',
            7: '',
        } as Record<number, string>,
        shift_effective_from: new Date().toISOString().split('T')[0],
        shift_effective_to: '',
    });

    transform((data) => ({
        ...data,
        company_id: data.company_id === 'none' ? null : data.company_id,
        group_id: data.group_id === 'none' ? null : data.group_id,
        shift_schedule: Object.fromEntries(
            Object.entries(data.shift_schedule).map(([k, v]) => [k, v === '' ? null : Number(v)])
        ),
    }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(UserController.store().url);
    };

    const formatRole = (role: string) => {
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleShiftScheduleChange = (dayId: number, value: string) => {
        setData('shift_schedule', {
            ...data.shift_schedule,
            [dayId]: value === 'none' ? '' : value,
        });
    };

    return (
        <>
            <Head title="Tambah User" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
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

                                    <div className="space-y-2">
                                        <Label htmlFor="group_id">Grup / Divisi (Opsional)</Label>
                                        <Select
                                            value={data.group_id}
                                            onValueChange={(value) => setData('group_id', value)}
                                        >
                                            <SelectTrigger id="group_id">
                                                <SelectValue placeholder="Pilih Grup" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Tidak ada (Kosong)</SelectItem>
                                                {groups.map((group) => (
                                                    <SelectItem key={group.id} value={group.id.toString()}>
                                                        {group.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.group_id} />
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

                            {/* Shift Assignment Section */}
                            <div className="border-t pt-6 mt-2">
                                <h3 className="text-sm font-medium border-b pb-2 mb-4 flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4 text-indigo-500" />
                                    <span>Jadwal Kerja Mingguan (Opsional)</span>
                                </h3>

                                <div className="space-y-6">
                                    {/* Grid Jadwal Senin - Minggu */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                                        {DAY_NAMES.map((day) => {
                                            const currentVal = data.shift_schedule[day.id] || 'none';
                                            return (
                                                <div key={day.id} className="flex flex-col p-3 rounded-lg border bg-card/40 gap-2">
                                                    <Label htmlFor={`day-shift-${day.id}`} className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                                        {day.name}
                                                    </Label>
                                                    <Select
                                                        value={currentVal}
                                                        onValueChange={(val) => handleShiftScheduleChange(day.id, val)}
                                                    >
                                                        <SelectTrigger id={`day-shift-${day.id}`} className="h-8 text-xs px-2">
                                                            <SelectValue placeholder="Libur" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none" className="text-xs text-rose-600 dark:text-rose-400 font-medium">Libur</SelectItem>
                                                            {shifts.map((shift) => (
                                                                <SelectItem key={shift.id} value={shift.id.toString()} className="text-xs">
                                                                    {shift.code.toUpperCase()}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.shift_schedule} />

                                    {/* Rentang Masa Berlaku */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="shift_effective_from">Mulai Berlaku</Label>
                                            <Input
                                                id="shift_effective_from"
                                                type="date"
                                                value={data.shift_effective_from}
                                                onChange={(e) => setData('shift_effective_from', e.target.value)}
                                                disabled={!Object.values(data.shift_schedule).some(val => val !== '')}
                                            />
                                            <InputError message={errors.shift_effective_from} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shift_effective_to">Berakhir (Opsional)</Label>
                                            <Input
                                                id="shift_effective_to"
                                                type="date"
                                                value={data.shift_effective_to}
                                                onChange={(e) => setData('shift_effective_to', e.target.value)}
                                                disabled={!Object.values(data.shift_schedule).some(val => val !== '')}
                                            />
                                            <InputError message={errors.shift_effective_to} />
                                        </div>
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
