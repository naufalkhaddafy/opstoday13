import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import CompanyController from '@/actions/App/Http/Controllers/Admin/CompanyController';

export default function CompanyCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        whatsapp_groups: [] as string[],
        leave_approval_settings: {
            rules: [
                {
                    id: 'rule_default',
                    name: 'Aturan Default',
                    group_ids: [],
                    is_default: true,
                    requirement: 'any',
                    workflow_type: 'parallel',
                    approver_ids: [],
                },
            ],
        },
    });

    const addGroup = () => {
        setData('whatsapp_groups', [...data.whatsapp_groups, '']);
    };

    const removeGroup = (index: number) => {
        setData('whatsapp_groups', data.whatsapp_groups.filter((_, i) => i !== index));
    };

    const updateGroup = (index: number, val: string) => {
        const newArr = [...data.whatsapp_groups];
        newArr[index] = val;
        setData('whatsapp_groups', newArr);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(CompanyController.store().url);
    };

    return (
        <>
            <Head title="Tambah Perusahaan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Tambah Perusahaan Baru</CardTitle>
                            <CardDescription>Buat data perusahaan pusat atau cabang.</CardDescription>
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
                                        placeholder="Misal: OpsToday Branch Jakarta"
                                    />
                                    <InputError message={errors.name} />
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Slug/URL unik akan di-generate otomatis dari nama ini.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Daftar WhatsApp Grup (Opsional)</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                                            <Plus className="mr-2 h-4 w-4" /> Tambah Grup
                                        </Button>
                                    </div>
                                    
                                    {data.whatsapp_groups.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic">Belum ada grup yang ditambahkan.</p>
                                    )}

                                    {data.whatsapp_groups.map((group, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    value={group}
                                                    onChange={(e) => updateGroup(index, e.target.value)}
                                                    placeholder="Misal: 628123456789-123456"
                                                />
                                                {/* @ts-ignore */}
                                                <InputError message={errors[`whatsapp_groups.${index}`]} className="mt-1" />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeGroup(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    
                                    {/* General array error */}
                                    {errors.whatsapp_groups && typeof errors.whatsapp_groups === 'string' && (
                                        <InputError message={errors.whatsapp_groups} />
                                    )}
                                </div>
                                
                                {/* Leave Approval Settings */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium">Alur Persetujuan Cuti</h3>
                                            <p className="text-sm text-muted-foreground">Atur aturan persetujuan cuti per grup operasional.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3.5 bg-blue-50 text-blue-800 rounded-md border border-blue-200 text-sm space-y-1">
                                        <p className="font-semibold flex items-center gap-1.5">
                                            ℹ️ Konfigurasi Aturan Persetujuan & Approver
                                        </p>
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            Setelah perusahaan dibuat dan pengguna/engineer ditambahkan, Anda dapat membuat <strong>beberapa aturan persetujuan (multi-rules)</strong> dan menetapkannya ke grup-grup kerja yang relevan melalui menu <strong>Edit Perusahaan</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t mt-6">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Simpan Perusahaan Baru
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CompanyCreate.layout = {
    breadcrumbs: [
        { title: 'Manajemen Perusahaan', href: CompanyController.index().url },
        { title: 'Tambah Perusahaan', href: CompanyController.create().url }
    ],
};
