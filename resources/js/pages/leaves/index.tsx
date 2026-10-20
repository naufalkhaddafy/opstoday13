import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, CalendarRange, Pencil, Trash2, CheckCircle2, XCircle, Clock, GitMerge, Shield } from 'lucide-react';
import { BRAND_ICON_BOX, LEAVE_TYPE_LABELS } from '@/lib/brand';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, FormEvent, useMemo } from 'react';
import InputError from '@/components/input-error';
import { LeaveTypeBadge } from '@/components/shared/LeaveTypeBadge';
import { approvalDisplayStatus } from '@/utils/leave-approval-status';

const MONTHS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

export default function LeaveIndex({ leaves, filters }: any) {
    const { auth } = usePage().props as any;
    const isEngineer = auth.user.role === 'engineer';
    
    const [search, setSearch] = useDebouncedSearch(filters?.search || '');
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    // Modal States
    const [editLeave, setEditLeave] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteLeave, setDeleteLeave] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [stagesLeave, setStagesLeave] = useState<any>(null);
    const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);

    const formattedSteps = useMemo(() => {
        if (!stagesLeave?.approvals || stagesLeave.approvals.length === 0) {
            return [];
        }

        const requirement = stagesLeave.user?.company?.approval_settings?.requirement || 'any';
        const workflowType = stagesLeave.user?.company?.approval_settings?.workflow_type || 'parallel';

        // Only group into a single step with 'or' if requirement is explicitly 'any'
        const isSingleStep = requirement === 'any';

        if (isSingleStep) {
            const approvals = stagesLeave.approvals;
            const approverNames = approvals.map((a: any) => a.approver_name);
            const displayName = approverNames.join(' or ');

            const approvedItem = approvals.find((a: any) => a.status === 'approved');
            const rejectedItem = approvals.find((a: any) => a.status === 'rejected');

            let status = 'pending';
            let approvedAt: string | null = null;
            let rejectionReason: string | null = null;
            let approvedBy: string | null = null;
            let rejectedBy: string | null = null;

            if (approvedItem) {
                status = 'approved';
                approvedAt = approvedItem.approved_at;
                approvedBy = approvedItem.approver_name;
            } else if (rejectedItem) {
                status = 'rejected';
                rejectionReason = rejectedItem.rejection_reason;
                rejectedBy = rejectedItem.approver_name;
            }

            return [{
                id: 'step-1',
                step_order: 1,
                display_name: displayName,
                status,
                approved_at: approvedAt,
                approved_by: approvedBy,
                rejection_reason: rejectionReason,
                rejected_by: rejectedBy,
                has_multiple: approverNames.length > 1,
                approvers: approvals,
            }];
        }

        // Multi-step (sequential or parallel-all)
        let sortedApprovals = [...stagesLeave.approvals];
        if (workflowType === 'sequential') {
            // If all have step_order = 1 (legacy DB records), preserve their array order as sequential steps
            const allStep1 = sortedApprovals.every((a: any) => a.step_order === 1);
            if (allStep1 && sortedApprovals.length > 1) {
                sortedApprovals = sortedApprovals.map((a: any, idx: number) => ({
                    ...a,
                    step_order: idx + 1,
                }));
            }
        }

        const stepGroups: { [key: number]: any[] } = {};
        for (const a of sortedApprovals) {
            const order = a.step_order || 1;
            if (!stepGroups[order]) stepGroups[order] = [];
            stepGroups[order].push(a);
        }

        const sortedOrders = Object.keys(stepGroups).map(Number).sort((a, b) => a - b);
        let previousStepApproved = true;

        return sortedOrders.map((order) => {
            const group = stepGroups[order];
            const approverNames = group.map((a: any) => a.approver_name);
            const displayName = approverNames.join(' & ');

            const approvedItem = group.find((a: any) => a.status === 'approved');
            const rejectedItem = group.find((a: any) => a.status === 'rejected');

            let status = 'pending';
            let approvedAt: string | null = null;
            let rejectionReason: string | null = null;
            let approvedBy: string | null = null;
            let rejectedBy: string | null = null;

            if (approvedItem && (group.length === 1 || group.every((a: any) => a.status === 'approved'))) {
                status = 'approved';
                approvedAt = approvedItem.approved_at;
                approvedBy = approvedItem.approver_name;
                previousStepApproved = true;
            } else if (rejectedItem) {
                status = 'rejected';
                rejectionReason = rejectedItem.rejection_reason;
                rejectedBy = rejectedItem.approver_name;
                previousStepApproved = false;
            } else {
                const allWaiting = group.every((a: any) => a.status === 'waiting');
                if (allWaiting || (workflowType === 'sequential' && !previousStepApproved)) {
                    status = 'waiting';
                }
                previousStepApproved = false;
            }

            return {
                id: `step-${order}`,
                step_order: order,
                display_name: displayName,
                status,
                approved_at: approvedAt,
                approved_by: approvedBy,
                rejection_reason: rejectionReason,
                rejected_by: rejectedBy,
                has_multiple: approverNames.length > 1,
                approvers: group,
            };
        });
    }, [stagesLeave]);

    const openStagesModal = (leave: any) => {
        setStagesLeave(leave);
        setIsStagesModalOpen(true);
    };

    const { data, setData, put, processing: isUpdating, errors, clearErrors, reset } = useForm({
        user_id: '',
        type: '',
        start_date: '',
        end_date: '',
        description: '',
        status: '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(window.location.search);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.get(window.location.pathname, Object.fromEntries(params.entries()), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openEditModal = (leave: any) => {
        setEditLeave(leave);
        setData({
            user_id: leave.user_id ? leave.user_id.toString() : '',
            type: leave.type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            description: leave.description || '',
            status: leave.status || 'approved',
        });
        clearErrors();
        setIsEditModalOpen(true);
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editLeave) return;

        put(`/leaves/${editLeave.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditLeave(null);
                reset();
            },
        });
    };

    const openDeleteModal = (leave: any) => {
        setDeleteLeave(leave);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (!deleteLeave) return;
        
        router.delete(`/leaves/${deleteLeave.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeleteLeave(null);
            },
        });
    };

    return (
        <>
            <Head title="Leave Requests" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <CalendarRange className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Leave Requests</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Manage annual leave, sick leave, and personal leave requests for engineers.</p>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href="/leaves/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Leave Request
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1 md:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by name or description..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-1 flex-col md:flex-row gap-2">
                                <Select
                                    value={filters?.month || 'all'}
                                    onValueChange={(val) => handleFilterChange('month', val)}
                                >
                                    <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Months</SelectItem>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filters?.year || 'all'}
                                    onValueChange={(val) => handleFilterChange('year', val)}
                                >
                                    <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Engineer</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Leave Type</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Start Date</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">End Date</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Description</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {leaves.data.length === 0 ? (
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td colSpan={7} className="p-2 align-middle h-24 text-center">
                                                No leave requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.data.map((leave: any) => {
                                            return (
                                                <tr key={leave.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                    <td className="p-2 align-middle font-medium">
                                                        {leave.user?.name || '-'}
                                                    </td>
                                                    <td className="p-2 align-middle">
                                                        <LeaveTypeBadge type={leave.type} />
                                                    </td>
                                                    <td className="p-2 align-middle">
                                                        {new Date(leave.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-2 align-middle">
                                                        {new Date(leave.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-2 align-middle max-w-[200px] truncate">
                                                        {leave.description || '-'}
                                                    </td>
                                                    <td className="p-2 align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => openStagesModal(leave)}
                                                            className="group inline-flex items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            title="View approval steps"
                                                        >
                                                            <Badge
                                                                variant={leave.status === 'approved' ? 'default' : leave.status === 'rejected' ? 'destructive' : 'outline'}
                                                                className={`cursor-pointer transition-all group-hover:opacity-90 group-hover:ring-2 group-hover:ring-ring/20 ${leave.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-300' : ''}`}
                                                            >
                                                                {leave.status ? leave.status.toUpperCase() : 'PENDING'}
                                                            </Badge>
                                                        </button>
                                                    </td>
                                                    <td className="p-2 align-middle text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => openEditModal(leave)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => openDeleteModal(leave)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit Leave Request</DialogTitle>
                            <DialogDescription>
                                Update the leave details for {editLeave?.user?.name}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Leave Type</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(val) => setData('type', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Leave Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cuti">{LEAVE_TYPE_LABELS.cuti}</SelectItem>
                                        <SelectItem value="sakit">{LEAVE_TYPE_LABELS.sakit}</SelectItem>
                                        <SelectItem value="izin">{LEAVE_TYPE_LABELS.izin}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">Start Date</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.start_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">End Date</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    placeholder="Optional. Enter a reason or description..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>

                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Leave Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the leave request from <strong>{deleteLeave?.user?.name}</strong> (Start date: {deleteLeave?.start_date})? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={executeDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Approval Stages Modal */}
            <Dialog open={isStagesModalOpen} onOpenChange={setIsStagesModalOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GitMerge className="h-5 w-5 text-brand-500" />
                            Leave Approval Steps
                        </DialogTitle>
                        <DialogDescription>
                            {stagesLeave?.user?.name}, {LEAVE_TYPE_LABELS[stagesLeave?.type] ?? stagesLeave?.type},{' '}
                            {stagesLeave?.start_date && new Date(stagesLeave.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 space-y-4">
                        {/* Approval Rule Summary Badges */}
                        {stagesLeave?.user?.company?.approval_settings && (
                            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Shield className="h-3.5 w-3.5 text-brand-600" />
                                        Rule: {stagesLeave.user.company.approval_settings.rule_name || 'Default'}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                                                stagesLeave.user.company.approval_settings.requirement === 'any'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                            }`}
                                        >
                                            {stagesLeave.user.company.approval_settings.requirement === 'any'
                                                ? 'Any One Approver'
                                                : 'All Approvers'}
                                        </span>
                                        {stagesLeave.user.company.approval_settings.requirement === 'all' && (
                                            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                                                {stagesLeave.user.company.approval_settings.workflow_type === 'sequential'
                                                    ? 'Sequential'
                                                    : 'Parallel'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {stagesLeave.user.company.approval_settings.requirement === 'any'
                                        ? 'This leave request is approved as soon as any one of the listed approvers approves it.'
                                        : stagesLeave.user.company.approval_settings.workflow_type === 'sequential'
                                        ? 'Approvers are notified in order. All approvers must approve this request.'
                                        : 'All approvers are notified at the same time, and all must approve this request.'}
                                </p>
                            </div>
                        )}

                        {!formattedSteps || formattedSteps.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                                <Clock className="h-8 w-8 text-muted-foreground/40" />
                                <p>No approval steps for this request.</p>
                                <p className="text-xs">
                                    {stagesLeave?.type !== 'cuti'
                                        ? 'Sick leave and personal leave are automatically approved.'
                                        : 'No approvers have been configured yet.'}
                                </p>
                            </div>
                        ) : (
                            <ol className="relative ml-3 border-l border-border">
                                {formattedSteps.map((step: any) => {
                                    const isApproved = step.status === 'approved';
                                    const isRejected = step.status === 'rejected';
                                    const isPending  = step.status === 'pending';
                                    const isWaiting  = step.status === 'waiting';

                                    return (
                                        <li key={step.id} className="mb-6 ml-5 last:mb-0">
                                            <span className={`absolute -left-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full ring-4 ring-background ${
                                                isApproved ? 'bg-[#2E7D32]' : isRejected ? 'bg-destructive' : isPending ? 'bg-amber-400' : 'bg-muted-foreground/30'
                                            }`}>
                                                {isApproved && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                                {isRejected && <XCircle      className="h-3.5 w-3.5 text-white" />}
                                                {isPending  && <Clock        className="h-3.5 w-3.5 text-white" />}
                                                {isWaiting  && <Clock        className="h-3.5 w-3.5 text-muted-foreground" />}
                                            </span>

                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-medium leading-tight">
                                                    Step {step.step_order}: {step.display_name}
                                                </p>
                                                <span className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                                    isApproved ? 'bg-green-100 text-green-800'
                                                    : isRejected ? 'bg-red-100 text-red-800'
                                                    : isPending ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-muted text-muted-foreground border'
                                                }`}>
                                                    {isWaiting ? 'Awaiting Turn' : step.status}
                                                </span>
                                                {isWaiting && (
                                                    <p className="text-xs text-muted-foreground italic pt-0.5">
                                                        Waiting for the previous step to be approved.
                                                    </p>
                                                )}
                                                {step.approvers && step.approvers.length > 1 ? (
                                                    <ul className="mt-1 space-y-1 rounded border border-border/60 bg-muted/20 p-2">
                                                        {step.approvers.map((approver: any, index: number) => {
                                                            const a = {
                                                                ...approver,
                                                                status: approvalDisplayStatus(
                                                                    approver.status,
                                                                    stagesLeave?.user?.company?.approval_settings?.requirement || 'any',
                                                                    stagesLeave?.status === 'approved' || stagesLeave?.approvals?.some((item: any) => item.status === 'approved'),
                                                                ),
                                                            };

                                                            return (
                                                            <li key={a.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                                                {stagesLeave?.user?.company?.approval_settings?.requirement === 'any' && index > 0 && (
                                                                    <span className="w-full text-muted-foreground">or</span>
                                                                )}
                                                                <span className="font-medium text-foreground">{a.approver_name}</span>
                                                                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                                    a.status === 'approved' ? 'bg-green-100 text-green-800'
                                                                    : a.status === 'rejected' ? 'bg-red-100 text-red-800'
                                                                    : a.status === 'pending' ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-muted text-muted-foreground border'
                                                                }`}>
                                                                    {a.status === 'waiting' ? 'Awaiting Turn' : a.status === 'closed' ? 'Closed' : a.status}
                                                                </span>
                                                                {a.approved_at && (
                                                                    <span className="text-muted-foreground tabular-nums">
                                                                        {new Date(a.approved_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                                {a.status === 'rejected' && a.rejection_reason && (
                                                                    <span className="w-full text-red-700">Reason: {a.rejection_reason}</span>
                                                                )}
                                                            </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <>
                                                        {step.approved_at && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {step.has_multiple && step.approved_by ? `Approved by ${step.approved_by} • ` : ''}
                                                                {new Date(step.approved_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        )}
                                                        {isRejected && step.rejection_reason && (
                                                            <p className="mt-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                                                                {step.has_multiple && step.rejected_by ? `Rejected by ${step.rejected_by}: ` : ''}
                                                                {step.rejection_reason}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStagesModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

LeaveIndex.layout = {
    breadcrumbs: [
        {
            title: 'Leave Requests',
            href: '#',
        },
    ],
};
