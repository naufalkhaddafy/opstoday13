import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { BRAND_ICON_BOX, BRAND_PAGE_HEADER } from '@/lib/brand';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';

type User = {
    id: number;
    name: string;
    email: string;
    employee_id: string | null;
};

type TicketsHeaderProps = {
    user: User;
    hideBackButton?: boolean;
};

export function TicketsHeader({ user, hideBackButton }: TicketsHeaderProps) {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 ${BRAND_PAGE_HEADER}`}>
            <div className="flex items-center gap-3">
                <div className={BRAND_ICON_BOX}>
                    <UserIcon className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{user.email}</span>
                        {user.employee_id && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-border"></span>
                                <span>ID: {user.employee_id}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {!hideBackButton && (
                <Button variant="outline" asChild className="shrink-0 w-full sm:w-auto">
                    <Link href={UserController.index().url}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Link>
                </Button>
            )}
        </div>
    );
}
