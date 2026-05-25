import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import CompanyController from '@/actions/App/Http/Controllers/Admin/CompanyController';

type CompanyFormProps = {
    company: {
        id: number;
        name: string;
        whatsapp_group_number: string | null;
    };
};

export default function CompanyEdit({ company }: CompanyFormProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: company.name,
        whatsapp_group_number: company.whatsapp_group_number || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(CompanyController.update({ company: company.id }).url);
    };

    return (
        <>
            <Head title={`Edit Perusahaan: ${company.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-3xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Edit Data Perusahaan</CardTitle>
                            <CardDescription>Ubah detail untuk cabang atau pusat operasional.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={CompanyController.index().url}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-4 max-w-lg">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Perusahaan <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Perhatian: Jika Anda mengubah nama perusahaan, URL slug untuk cabang ini juga akan berubah secara otomatis.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp_group_number">No. WhatsApp Grup (Opsional)</Label>
                                    <Input
                                        id="whatsapp_group_number"
                                        value={data.whatsapp_group_number}
                                        onChange={(e) => setData('whatsapp_group_number', e.target.value)}
                                    />
                                    <InputError message={errors.whatsapp_group_number} />
                                </div>
                            </div>

                            <div className="flex justify-start pt-6 border-t mt-6">
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

CompanyEdit.layout = {
    breadcrumbs: [
        { title: 'Manajemen Perusahaan', href: CompanyController.index().url },
        { title: 'Edit Perusahaan', href: '#' }
    ],
};
