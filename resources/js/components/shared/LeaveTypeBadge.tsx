import { Badge } from '@/components/ui/badge';
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_STYLES } from '@/lib/brand';

export function LeaveTypeBadge({ type }: { type: string }) {
    return (
        <Badge variant="outline" className={LEAVE_TYPE_STYLES[type]}>
            {LEAVE_TYPE_LABELS[type] ?? type}
        </Badge>
    );
}
