import { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { store } from '@/routes/onboarding';

interface Company {
    id: number;
    name: string;
}

interface Group {
    id: number;
    name: string;
}

interface Props {
    companies: Company[];
    groups: Group[];
}

export default function Onboarding({ companies, groups }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        company_id: '',
        group_id: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(store.url());
    };

    return (
        <>
            <Head title="Lengkapi Profil" />

            <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Lengkapi Profil Anda</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Silakan lengkapi data ID Karyawan, Perusahaan, dan Tim sebelum menggunakan sistem.
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="employee_id">ID Karyawan (NIP/NIK)</Label>
                        <Input
                            id="employee_id"
                            type="text"
                            name="employee_id"
                            value={data.employee_id}
                            onChange={(e) => setData('employee_id', e.target.value)}
                            required
                            autoFocus
                            placeholder="Masukkan ID Karyawan Anda"
                        />
                        <InputError message={errors.employee_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company_id">Perusahaan (PT)</Label>
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
                        <Label htmlFor="group_id">Tim / Grup</Label>
                        <Select
                            value={data.group_id}
                            onValueChange={(val) => setData('group_id', val)}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Tim" />
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

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                        Simpan Profil
                    </Button>
                </form>
            </div>
        </>
    );
}

// Assume it uses the Guest layout or similar layout implicitly via layout configuration.
import AuthLayout from '@/layouts/auth-layout';
Onboarding.layout = (page: React.ReactNode) => <AuthLayout>{page}</AuthLayout>;
