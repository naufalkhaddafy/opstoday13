import { Badge } from '@/components/ui/badge';
import { APPROVAL_STEP_STATUS_STYLES, LEAVE_TYPE_LABELS } from '@/lib/brand';
import type { LeaveApprovalActionProps } from '@/types/leave-approval-action';

export function ApprovalResultDetails({ result }: { result: NonNullable<LeaveApprovalActionProps['approvalResult']> }) {
    const details = [
        ['Company', result.company],
        ['Leave Type', LEAVE_TYPE_LABELS[result.leaveType] ?? result.leaveType],
        ['Approved By', result.approver],
        ['Approved At', result.approvedAt ?? '-'],
        ['Description', result.description || '-'],
    ];

    return (
        <div className="space-y-6">
            <div role="status" className={`rounded-lg border p-4 text-sm ${APPROVAL_STEP_STATUS_STYLES.approved}`}>
                <p className="font-semibold">Your approval has been recorded.</p>
                <p className="mt-1">{result.leaveStatus === 'approved' ? 'This leave request is fully approved.' : result.leaveStatus === 'rejected' ? 'This leave request was subsequently rejected by another approver.' : 'This leave request is awaiting the remaining approvals.'}</p>
            </div>
            <dl className="divide-y rounded-lg border px-4">
                {details.map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-3 text-sm sm:grid-cols-[160px_1fr] sm:gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="min-w-0 whitespace-pre-wrap break-words font-medium">{value}</dd>
                    </div>
                ))}
                <div className="grid gap-1 py-3 text-sm sm:grid-cols-[160px_1fr] sm:gap-4">
                    <dt className="text-muted-foreground">Your Approval</dt>
                    <dd><Badge variant="outline" className={APPROVAL_STEP_STATUS_STYLES.approved}>Approved</Badge></dd>
                </div>
                <div className="grid gap-1 py-3 text-sm sm:grid-cols-[160px_1fr] sm:gap-4">
                    <dt className="text-muted-foreground">Request Status</dt>
                    <dd><Badge variant="outline" className={APPROVAL_STEP_STATUS_STYLES[result.leaveStatus]}>{result.leaveStatus === 'approved' ? 'Approved' : result.leaveStatus === 'rejected' ? 'Rejected' : 'Pending'}</Badge></dd>
                </div>
            </dl>
        </div>
    );
}
