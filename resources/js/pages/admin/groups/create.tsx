import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GroupController from '@/actions/App/Http/Controllers/Admin/GroupController';
import InputError from '@/components/input-error';

export default function GroupCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(GroupController.store().url);
    };

    return (
        <>
            <Head title="Tambah Grup" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={GroupController.index().url}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Tambah Grup Baru</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Grup</CardTitle>
                        <CardDescription>Masukkan detail grup atau divisi baru.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Grup <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: DCO Shift"
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                                <p className="text-xs text-muted-foreground">Slug akan di-generate otomatis berdasarkan nama.</p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={GroupController.index().url}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Grup
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

GroupCreate.layout = {
    breadcrumbs: [
        { title: 'Manajemen Grup', href: GroupController.index().url },
        { title: 'Tambah', href: GroupController.create().url },
    ],
};
