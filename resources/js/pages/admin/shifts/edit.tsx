import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/shared/FormField';
import ShiftController from '@/actions/App/Http/Controllers/Admin/ShiftController';


type ShiftFormProps = {
    shift: {
        id: number;
        code: string;
        name: string;
        start_time: string;
        end_time: string;
        is_overnight: boolean;
        work_date_rule: string;
        grace_minutes: number;
        type: string;
    };
    enums: {
        types: { value: string; label: string }[];
        work_date_rules: { value: string; label: string }[];
    };
};

export default function ShiftEdit({ shift, enums }: ShiftFormProps) {
    const { data, setData, put, processing, errors } = useForm({
        code: shift.code,
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        is_overnight: shift.is_overnight,
        work_date_rule: shift.work_date_rule,
        grace_minutes: shift.grace_minutes,
        type: shift.type,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(ShiftController.update({ shift: shift.id }).url);
    };

    return (
        <>
            <Head title={`Edit Shift: ${shift.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Edit Shift</CardTitle>
                            <CardDescription>Perbarui konfigurasi jam kerja secara global.</CardDescription>
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

                                    <FormField label="Kode Shift" htmlFor="code" required error={errors.code}>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            required
                                        />
                                    </FormField>

                                    <FormField label="Nama Shift" htmlFor="name" required error={errors.name}>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                    </FormField>

                                    <FormField label="Tipe Shift" htmlFor="type" required error={errors.type}>
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
                                    </FormField>
                                </div>

                                {/* Right Column: Time Rules */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium border-b pb-2">Aturan Waktu</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Jam Masuk" htmlFor="start_time" required error={errors.start_time}>
                                            <Input
                                                id="start_time"
                                                type="time"
                                                value={data.start_time}
                                                onChange={(e) => setData('start_time', e.target.value)}
                                                required
                                            />
                                        </FormField>

                                        <FormField label="Jam Pulang" htmlFor="end_time" required error={errors.end_time}>
                                            <Input
                                                id="end_time"
                                                type="time"
                                                value={data.end_time}
                                                onChange={(e) => setData('end_time', e.target.value)}
                                                required
                                            />
                                        </FormField>
                                    </div>

                                    <FormField label="Shift Lintas Hari (Overnight / Night Shift)" htmlFor="is_overnight" error={errors.is_overnight}>
                                        <div className="flex items-center space-x-2 pt-1">
                                            <Checkbox 
                                                id="is_overnight" 
                                                checked={data.is_overnight}
                                                onCheckedChange={(checked) => setData('is_overnight', checked as boolean)}
                                            />
                                            <Label htmlFor="is_overnight" className="cursor-pointer font-normal">
                                                Aktif
                                            </Label>
                                        </div>
                                    </FormField>

                                    <FormField label="Aturan Tanggal Kerja" htmlFor="work_date_rule" required error={errors.work_date_rule}>
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
                                    </FormField>

                                    <FormField label="Toleransi Keterlambatan (Menit)" htmlFor="grace_minutes" error={errors.grace_minutes}>
                                        <Input
                                            id="grace_minutes"
                                            type="number"
                                            min="0"
                                            value={data.grace_minutes}
                                            onChange={(e) => setData('grace_minutes', parseInt(e.target.value) || 0)}
                                        />
                                    </FormField>
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

ShiftEdit.layout = {
    breadcrumbs: [
        { title: 'Manajemen Shift', href: ShiftController.index().url },
        { title: 'Edit Shift', href: '#' }
    ],
};
