import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GroupController from '@/actions/App/Http/Controllers/Admin/GroupController';
import InputError from '@/components/input-error';

type EditProps = {
    group: {
        id: number;
        name: string;
    };
};

export default function GroupEdit({ group }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: group.name,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(GroupController.update({ group: group.id }).url);
    };

    return (
        <>
            <Head title={`Edit Grup - ${group.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Edit Grup</CardTitle>
                            <CardDescription>Perbarui detail grup <strong>{group.name}</strong>.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={GroupController.index().url}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Link>
                        </Button>
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
                                <p className="text-xs text-muted-foreground">Slug akan diperbarui secara otomatis jika nama diubah.</p>
                            </div>

                            <div className="flex justify-end pt-6 border-t mt-6">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

GroupEdit.layout = {
    breadcrumbs: [
        { title: 'Manajemen Grup', href: GroupController.index().url },
        { title: 'Edit', href: '#' },
    ],
};
