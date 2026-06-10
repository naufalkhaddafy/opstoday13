import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';

export default function WaitingVerification() {
    const { post } = useForm();

    return (
        <>
            <Head title="Menunggu Verifikasi" />

            <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md mx-auto text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                
                <h1 className="text-2xl font-bold tracking-tight">Profil Berhasil Disimpan!</h1>
                
                <p className="text-muted-foreground">
                    Terima kasih telah melengkapi profil Anda. Akun Anda saat ini sedang dalam status <strong>Menunggu Verifikasi</strong> oleh SPV atau Administrator.
                </p>

                <p className="text-sm text-muted-foreground">
                    Silakan hubungi SPV Anda untuk mempercepat proses verifikasi agar Anda dapat segera menggunakan sistem.
                </p>

                <div className="mt-4 w-full border-t pt-6">
                    <form onSubmit={(e) => { e.preventDefault(); post(logout.url()); }}>
                        <Button type="submit" variant="outline" className="w-full">
                            Keluar (Logout)
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}

WaitingVerification.layout = (page: React.ReactNode) => <AuthLayout>{page}</AuthLayout>;
