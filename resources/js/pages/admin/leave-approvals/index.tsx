import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { APPROVAL_STEP_STATUS_STYLES, BRAND_ICON_BOX, LEAVE_TYPE_LABELS } from '@/lib/brand';
import { approvalDisplayStatus } from '@/utils/leave-approval-status';

type ApprovalStep = {
    approver_name: string | null;
    status: 'pending' | 'waiting' | 'approved' | 'rejected' | 'closed';
    step_order: number;
    acted_at: string | null;
    rejection_reason: string | null;
};

type LeaveApproval = {
    id: number;
    step_order: number;
    total_steps: number;
    approver_name: string | null;
    workflow_type: 'parallel' | 'sequential';
    requirement: 'any' | 'all';
    approval_chain: ApprovalStep[];
    leave: {
        user: { name: string; company?: { name: string } | null } | null;
        type: string;
        start_date: string;
        end_date: string;
        description: string | null;
    };
};

const formatLeaveType = (type: string) => LEAVE_TYPE_LABELS[type] ?? type;

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });

function ApprovalStepBadge({ step, status = step.status }: { step: ApprovalStep; status?: string }) {
    return (
        <Badge variant="outline" className={APPROVAL_STEP_STATUS_STYLES[status]}>
            {status === 'waiting' ? 'Awaiting Turn' : status === 'closed' ? 'Closed' : status}
        </Badge>
    );
}

function ApprovalChainList({ approval }: { approval: LeaveApproval }) {
    const chain = approval.approval_chain ?? [];

    if (chain.length === 0) {
return null;
}

    const isAnyApprover = approval.requirement === 'any';
    const showStepNumber = !isAnyApprover && chain.length > 1 && approval.workflow_type === 'sequential';

    return (
        <ul className="space-y-1.5">
            {chain.map((step, index) => (
                <li key={`${step.approver_name ?? 'approver'}-${index}`} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {isAnyApprover && index > 0 && (
                        <span className="w-full text-xs text-muted-foreground">or</span>
                    )}
                    {showStepNumber && (
                        <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
                            Step {step.step_order}
                        </span>
                    )}
                    <span className="text-sm font-medium">{step.approver_name ?? '-'}</span>
                    <ApprovalStepBadge step={step} status={approvalDisplayStatus(step.status, approval.requirement, chain.some((item) => item.status === 'approved'))} />
                    {step.acted_at && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {formatDateTime(step.acted_at)}
                        </span>
                    )}
                    {step.status === 'rejected' && step.rejection_reason && (
                        <span className="w-full text-xs text-muted-foreground">
                            Reason: {step.rejection_reason}
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}

export default function LeaveApprovalIndex({ approvals }: { approvals: LeaveApproval[] }) {
    const [selectedApproval, setSelectedApproval] = useState<LeaveApproval | null>(null);
    const [selectedApproveApproval, setSelectedApproveApproval] = useState<LeaveApproval | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        rejection_reason: '',
    });

    const openApproveModal = (approval: LeaveApproval) => {
        setSelectedApproveApproval(approval);
        setIsApproveModalOpen(true);
    };

    const handleConfirmApprove = () => {
        if (!selectedApproveApproval) {
return;
}

        setIsApproving(true);
        router.post(`/admin/leave-approvals/${selectedApproveApproval.id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsApproveModalOpen(false);
                setSelectedApproveApproval(null);
            },
            onFinish: () => {
                setIsApproving(false);
            },
        });
    };

    const openRejectModal = (approval: LeaveApproval) => {
        setSelectedApproval(approval);
        reset();
        clearErrors();
        setIsRejectModalOpen(true);
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedApproval) {
return;
}
        
        post(`/admin/leave-approvals/${selectedApproval.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsRejectModalOpen(false);
                setSelectedApproval(null);
            },
        });
    };

    return (
        <>
            <Head title="Leave Approvals" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <CheckCircle2 className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Pending Leave Approvals</CardTitle>
                                <CardDescription>Leave requests awaiting your approval.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Engineer</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Company</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Step</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Leave Type</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Dates</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                        <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {approvals.length === 0 ? (
                                        <tr className="border-b transition-colors hover:bg-muted/50">
                                            <td colSpan={7} className="p-4 align-middle h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
                                                    <p>No leave requests are awaiting your approval.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        approvals.map((approval) => {
                                            const leave = approval.leave;

                                            return (
                                                <tr key={approval.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">
                                                        {leave.user?.name}
                                                    </td>
                                                    <td className="p-4 align-middle text-muted-foreground">
                                                        {leave.user?.company?.name || '-'}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                                                            {approval.step_order}/{approval.total_steps ?? approval.step_order}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Badge variant={leave.type === 'sakit' ? 'destructive' : leave.type === 'izin' ? 'secondary' : 'default'}>
                                                            {formatLeaveType(leave.type)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="font-medium">
                                                            {new Date(leave.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        {leave.start_date !== leave.end_date && (
                                                            <div className="text-muted-foreground text-xs">
                                                                to {new Date(leave.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle max-w-[200px]">
                                                        {leave.description || '-'}
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                                                                onClick={() => openApproveModal(approval)}
                                                            >
                                                                <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => openRejectModal(approval)}
                                                            >
                                                                <XCircle className="mr-1 h-4 w-4" /> Reject
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Approve Confirmation Modal */}
            <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
                            Confirm Leave Approval
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this leave request?
                        </DialogDescription>
                    </DialogHeader>
                    {selectedApproveApproval && (
                        <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm my-2">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Engineer:</span>
                                <span className="font-semibold">{selectedApproveApproval.leave?.user?.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Step:</span>
                                <span className="font-semibold tabular-nums">
                                    {selectedApproveApproval.step_order} / {selectedApproveApproval.total_steps ?? selectedApproveApproval.step_order}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Approver:</span>
                                <span className="font-semibold text-right">
                                    {selectedApproveApproval.requirement === 'any' && selectedApproveApproval.approval_chain?.length > 0
                                        ? selectedApproveApproval.approval_chain.map((step) => step.approver_name || '-').join(' or ')
                                        : selectedApproveApproval.approver_name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Company:</span>
                                <span>{selectedApproveApproval.leave?.user?.company?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Leave Type:</span>
                                <Badge variant={selectedApproveApproval.leave?.type === 'sakit' ? 'destructive' : selectedApproveApproval.leave?.type === 'izin' ? 'secondary' : 'default'}>
                                    {formatLeaveType(selectedApproveApproval.leave.type)}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Period:</span>
                                <span>
                                    {new Date(selectedApproveApproval.leave?.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {selectedApproveApproval.leave?.start_date !== selectedApproveApproval.leave?.end_date && (
                                        <> to {new Date(selectedApproveApproval.leave?.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                                    )}
                                </span>
                            </div>
                            {selectedApproveApproval.approval_chain && selectedApproveApproval.approval_chain.length > 1 && (
                                <div className="pt-2 border-t space-y-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Approval Status ({selectedApproveApproval.workflow_type === 'sequential' ? 'Sequential' : 'Parallel'})
                                    </span>
                                    <ApprovalChainList approval={selectedApproveApproval} />
                                </div>
                            )}
                            {selectedApproveApproval.leave?.description && (
                                <div className="pt-2 border-t text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">Description:</span> {selectedApproveApproval.leave?.description}
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="gap-3 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsApproveModalOpen(false)}
                            disabled={isApproving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                            onClick={handleConfirmApprove}
                            disabled={isApproving}
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve Leave
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent>
                    <form onSubmit={handleReject}>
                        <DialogHeader>
                            <DialogTitle>Reject Leave Request</DialogTitle>
                            <DialogDescription>
                                You are about to reject the leave request from <strong>{selectedApproval?.leave?.user?.name}</strong>. Please provide a reason for rejection (required).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="rejection_reason">Reason for Rejection</Label>
                            <textarea
                                id="rejection_reason"
                                rows={3}
                                className="mt-2 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="For example: Insufficient staffing or no remaining leave balance."
                                value={data.rejection_reason}
                                onChange={e => setData('rejection_reason', e.target.value)}
                                required
                            />
                            <InputError message={errors.rejection_reason} className="mt-2" />
                        </div>
                        <DialogFooter className="gap-3 sm:gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive" disabled={processing || !data.rejection_reason}>
                                Reject Leave
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

LeaveApprovalIndex.layout = {
    breadcrumbs: [
        { title: 'Leave Approvals', href: '#' },
    ],
};
