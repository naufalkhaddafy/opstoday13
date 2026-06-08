import { Badge } from '@/components/ui/badge';
import { TICKET_STATUS_STYLES } from '@/lib/brand';

export function TicketStatusBadge({ 
    status, 
    label 
}: { 
    status: string | null; 
    label?: string | null 
}) {
    const defaultLabel = status ? status.replace(/_/g, ' ').toUpperCase() : '-';
    
    return (
        <Badge variant="outline" className={status ? TICKET_STATUS_STYLES[status] : ''}>
            {label ?? defaultLabel}
        </Badge>
    );
}
