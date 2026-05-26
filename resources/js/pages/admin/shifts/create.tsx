import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import ShiftController from '@/actions/App/Http/Controllers/Admin/ShiftController';


type CreateProps = {
    enums: {
        types: { value: string; label: string }[];
        work_date_rules: { value: string; label: string }[];
    };
};

export default function ShiftCreate({ enums }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        start_time: '08:00',
        end_time: '17:00',
        is_overnight: false,
        work_date_rule: 'calendar_day',
        grace_minutes: 0,
        type: 'steady',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(ShiftController.store().url);
    };

    return (
        <>
            <Head title="Tambah Shift" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Tambah Shift Baru</CardTitle>
                            <CardDescription>Buat konfigurasi jam kerja baru untuk seluruh cabang.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={ShiftController.index().url}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Basic Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium border-b pb-2">Informasi Dasar</h3>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Kode Shift <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            required
                                            placeholder="Misal: SFT-PAGI"
                                        />
                                        <InputError message={errors.code} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Shift <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="Misal: Shift Pagi Reguler"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">Tipe Shift <span className="text-destructive">*</span></Label>
                                        <Select 
                                            value={data.type} 
                                            onValueChange={(value) => setData('type', value)}
                                            required
                                        >
                                            <SelectTrigger id="type">
                                                <SelectValue placeholder="Pilih Tipe Shift" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {enums.types.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.type} />
                                    </div>
                                </div>

                                {/* Right Column: Time Rules */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium border-b pb-2">Aturan Waktu</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="start_time">Jam Masuk <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="start_time"
                                                type="time"
                                                value={data.start_time}
                                                onChange={(e) => setData('start_time', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.start_time} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="end_time">Jam Pulang <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="end_time"
                                                type="time"
                                                value={data.end_time}
                                                onChange={(e) => setData('end_time', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.end_time} />
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="is_overnight" 
                                                checked={data.is_overnight}
                                                onCheckedChange={(checked) => setData('is_overnight', checked as boolean)}
                                            />
                                            <Label htmlFor="is_overnight" className="cursor-pointer font-normal">
                                                Shift Lintas Hari (Overnight / Night Shift)
                                            </Label>
                                        </div>
                                        <InputError message={errors.is_overnight} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="work_date_rule">Aturan Tanggal Kerja <span className="text-destructive">*</span></Label>
                                        <Select 
                                            value={data.work_date_rule} 
                                            onValueChange={(value) => setData('work_date_rule', value)}
                                            required
                                        >
                                            <SelectTrigger id="work_date_rule">
                                                <SelectValue placeholder="Pilih Aturan Tanggal" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {enums.work_date_rules.map((rule) => (
                                                    <SelectItem key={rule.value} value={rule.value}>
                                                        {rule.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.work_date_rule} />
                                        <p className="text-xs text-muted-foreground">
                                            Penentuan tanggal rekaman absensi. "Calendar Day" untuk hari yang sama dengan jam masuk. "Next Day" bila shift dimulai malam dan dihitung sebagai kerja esok hari.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="grace_minutes">Toleransi Keterlambatan (Menit)</Label>
                                        <Input
                                            id="grace_minutes"
                                            type="number"
                                            min="0"
                                            value={data.grace_minutes}
                                            onChange={(e) => setData('grace_minutes', parseInt(e.target.value) || 0)}
                                        />
                                        <InputError message={errors.grace_minutes} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t mt-6">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Simpan Konfigurasi
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ShiftCreate.layout = {
    breadcrumbs: [
        { title: 'Manajemen Shift', href: ShiftController.index().url },
        { title: 'Tambah Shift', href: ShiftController.create().url }
    ],
};
