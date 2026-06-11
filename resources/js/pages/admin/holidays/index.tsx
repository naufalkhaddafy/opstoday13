import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BRAND_ICON_BOX } from '@/lib/brand';
import { formatDate } from '@/components/dashboard/helpers';
import HolidayController from '@/actions/App/Http/Controllers/Admin/HolidayController';

interface Holiday {
    id: number;
    date: string;
    name: string;
    is_recurrent: boolean;
}

interface IndexProps {
    holidays: Holiday[];
}

export default function Index({ holidays }: IndexProps) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this holiday?')) {
            destroy(HolidayController.destroy({ holiday: id }).url);
        }
    };

    return (
        <>
            <Head title="Manage Holidays" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <CalendarDays className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Holidays</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Manage global public holidays and off days.</p>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href={HolidayController.create().url}>
                                <Plus className="mr-2 h-4 w-4" /> Add Holiday
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holidays.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                                No holidays found.
                                            </td>
                                        </tr>
                                    ) : (
                                        holidays.map((holiday) => (
                                            <tr key={holiday.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-medium">{formatDate(holiday.date)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span>{holiday.name}</span>
                                                        {holiday.is_recurrent ? (
                                                            <Badge variant="outline" className="bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-800">Tahunan</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-muted text-muted-foreground">Sekali Saja</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={HolidayController.edit({ holiday: holiday.id }).url}>
                                                                <Edit className="h-4 w-4 text-amber-600" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(holiday.id)}>
                                                            <Trash2 className="h-4 w-4 text-rose-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Holidays', href: '/admin/holidays' },
    ],
};
