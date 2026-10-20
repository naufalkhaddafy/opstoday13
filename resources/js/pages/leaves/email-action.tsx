import { Head, Link } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { ApprovalResultDetails } from '@/components/leaves/ApprovalResultDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useLeaveEmailAction } from '@/hooks/use-leave-email-action';
import type { LeaveApprovalActionProps } from '@/types/leave-approval-action';

export default function LeaveEmailAction(props: LeaveApprovalActionProps) {
    const { data, setData, post, processing, errors } = useLeaveEmailAction(props);
    const problem = props.error || (props.approvalResult ? null : errors.token);
    const title = props.approvalResult ? (props.approvalResult.leaveStatus === 'approved' ? 'Leave Request Approved' : 'Approval Recorded') : problem ? 'Approval Link Unavailable' : props.action === 'approve' ? 'Approving Leave Request' : 'Reject Leave Request';

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (props.decisionUrl) {
            post(props.decisionUrl);
        }
    };

    return (
        <>
            <Head title={title}>
                <meta name="referrer" content="no-referrer" />
            </Head>
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row">
                        <div className="min-w-0 space-y-2">
                            <CardTitle>{title}</CardTitle>
                            <CardDescription className="break-words">{props.engineer}: {props.startDate} to {props.endDate}</CardDescription>
                        </div>
                        <Button variant="outline" asChild><Link href="/admin/leave-approvals">Back to Approvals</Link></Button>
                    </CardHeader>
                    <CardContent>
                        {props.approvalResult ? (
                            <ApprovalResultDetails result={props.approvalResult} />
                        ) : problem ? (
                            <p role="alert" className="text-sm text-destructive">{problem}</p>
                        ) : props.action === 'approve' ? (
                            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Processing your approval. Please keep this page open.</p>
                        ) : (
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rejection_reason">Reason for Rejection (required)</Label>
                                    <textarea id="rejection_reason" required maxLength={500} rows={4}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={data.rejection_reason} onChange={(event) => setData('rejection_reason', event.target.value)} />
                                    <InputError message={errors.rejection_reason} />
                                </div>
                                <div className="flex justify-end border-t pt-6">
                                    <Button type="submit" variant="destructive" disabled={processing || !data.rejection_reason.trim()}>
                                        {processing ? 'Submitting...' : 'Reject Leave Request'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

LeaveEmailAction.layout = { breadcrumbs: [{ title: 'Leave Request', href: '/leaves' }] };
