import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';


export default function LeaveCreate({ types, users }: any) {
    const { auth } = usePage().props as any;
    const isEngineer = auth.user.role === 'engineer';

    const { data, setData, post, processing, errors } = useForm({
        user_id: isEngineer ? auth.user.id.toString() : '',
        type: 'cuti',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/leaves');
    };

    return (
        <>
            <Head title="Buat Pengajuan Cuti" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Formulir Pengajuan Cuti</CardTitle>
                            <CardDescription>
                                {isEngineer ? 'Pengajuan Anda akan otomatis disetujui dalam sistem.' : 'Masukkan detail cuti untuk pegawai.'}
                            </CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/leaves">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            {!isEngineer && users && (
                                <div className="space-y-2">
                                    <Label htmlFor="user_id">Pilih Pegawai <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={data.user_id}
                                        onValueChange={(val) => setData('user_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Pegawai" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u: any) => (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    {u.name} ({u.employee_id || '-'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.user_id} />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="type">Jenis Pengajuan <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(val) => setData('type', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cuti">Cuti Tahunan</SelectItem>
                                        <SelectItem value="sakit">Sakit</SelectItem>
                                        <SelectItem value="izin">Izin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Tanggal Mulai <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.start_date} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">Tanggal Selesai <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Keterangan / Alasan</Label>
                                <textarea
                                    id="description"
                                    placeholder="Opsional. Masukkan alasan atau keterangan..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="flex justify-end pt-6 border-t mt-6">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Simpan Pengajuan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

LeaveCreate.layout = {
    breadcrumbs: [
        { title: 'Pengajuan Cuti', href: '/leaves' },
        { title: 'Baru', href: '/leaves/create' }
    ],
};
