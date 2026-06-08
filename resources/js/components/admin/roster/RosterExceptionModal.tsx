import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Shift = {
    id: number;
    code: string;
    name: string;
};

type RosterExceptionModalProps = {
    isOpen: boolean;
    userName: string;
    date: string;
    shifts: Shift[];
    exceptionData: {
        user_id: string;
        date: string;
        shift_id: string;
    };
    processingException: boolean;
    setExceptionData: (key: 'shift_id', value: string) => void;
    closeExceptionModal: () => void;
    submitException: (e: React.FormEvent) => void;
    removeException: () => void;
};

export function RosterExceptionModal({
    isOpen,
    userName,
    date,
    shifts,
    exceptionData,
    processingException,
    setExceptionData,
    closeExceptionModal,
    submitException,
    removeException,
}: RosterExceptionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeExceptionModal()}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submitException}>
                    <DialogHeader>
                        <DialogTitle>Kustomisasi Jadwal Harian</DialogTitle>
                        <DialogDescription>
                            Ubah jadwal untuk <strong>{userName}</strong> pada tanggal{' '}
                            <strong>
                                {date &&
                                    new Date(date).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                            </strong>
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="shift">Pilih Shift</Label>
                            <Select
                                value={exceptionData.shift_id}
                                onValueChange={(val) => setExceptionData('shift_id', val)}
                            >
                                <SelectTrigger id="shift">
                                    <SelectValue placeholder="Pilih shift..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="text-rose-600 font-medium">
                                        Libur (Off)
                                    </SelectItem>
                                    {shifts.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name} ({s.code.toUpperCase()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Pengecualian ini akan menimpa jadwal mingguan karyawan hanya untuk tanggal ini saja.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={removeException}
                            disabled={processingException}
                        >
                            Hapus Pengecualian
                        </Button>
                        <Button type="submit" disabled={processingException}>
                            Simpan Jadwal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
