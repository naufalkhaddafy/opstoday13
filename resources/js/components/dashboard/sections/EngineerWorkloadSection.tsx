import { Deferred } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EngineerCard } from '@/components/dashboard/EngineerCard';
import { EngineerCardSkeleton } from '@/components/dashboard/Skeletons';

interface EngineerWorkloadSectionProps {
    engineers?: any[];
    attendance?: any;
    attendanceByUserId: Map<number, any>;
    slaHighTicketLoad?: number;
}

export function EngineerWorkloadSection({
    engineers,
    attendance,
    attendanceByUserId,
    slaHighTicketLoad,
}: EngineerWorkloadSectionProps) {
    return (
        <section className="flex flex-col gap-4">
            <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Users className="h-5 w-5 text-[#2E7D32]" /> Team Ticket Workload
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Engineer ticket workload for the selected filters.
                </p>
            </div>
            <Deferred data={["engineers", "attendance"]} fallback={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <EngineerCardSkeleton /><EngineerCardSkeleton /><EngineerCardSkeleton />
                </div>
            }>
                {engineers && attendance && (
                    engineers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {engineers.map((engineer) => (
                                <EngineerCard
                                    key={engineer.id}
                                    engineer={engineer}
                                    attendance={attendanceByUserId.get(engineer.id) ?? null}
                                    variant="tickets"
                                    slaHighTicketLoad={slaHighTicketLoad}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-8 text-center text-muted-foreground">No engineers registered yet.</CardContent>
                        </Card>
                    )
                )}
            </Deferred>
        </section>
    );
}
