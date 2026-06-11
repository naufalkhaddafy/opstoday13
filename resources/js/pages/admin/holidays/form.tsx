import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import HolidayController from '@/actions/App/Http/Controllers/Admin/HolidayController';

interface Holiday {
    id: number;
    date: string;
    name: string;
    is_recurrent: boolean;
}

interface FormProps {
    holiday?: Holiday;
}

export default function Form({ holiday }: FormProps) {
    const isEdit = !!holiday;

    const { data, setData, post, put, processing, errors } = useForm({
        date: holiday?.date || '',
        name: holiday?.name || '',
        is_recurrent: holiday?.is_recurrent || false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(HolidayController.update({ holiday: holiday.id }).url);
        } else {
            post(HolidayController.store().url);
        }
    };

    return (
        <>
            <Head title={isEdit ? "Edit Holiday" : "Create Holiday"} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>{isEdit ? "Edit Holiday" : "Create Holiday"}</CardTitle>
                            <CardDescription>{isEdit ? "Update holiday details." : "Add a new global public holiday."}</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={HolidayController.index().url}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className={errors.date ? 'border-destructive' : ''}
                                    />
                                    {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Holiday Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Idul Fitri"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <Checkbox
                                        id="is_recurrent"
                                        checked={data.is_recurrent}
                                        onCheckedChange={(checked) => setData('is_recurrent', checked as boolean)}
                                    />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="is_recurrent">Berulang Tiap Tahun</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Jika dicentang, libur ini akan berlaku setiap tahun pada tanggal dan bulan yang sama.
                                        </p>
                                    </div>
                                    {errors.is_recurrent && <p className="text-sm text-destructive">{errors.is_recurrent}</p>}
                                </div>
                            </div>
                            <div className="flex justify-end pt-6 border-t mt-6">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Simpan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Form.layout = {
    breadcrumbs: [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Holidays', href: '/admin/holidays' },
        { title: 'Form', href: '#' },
    ],
};
