import { useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import type { LeaveApprovalActionProps } from '@/types/leave-approval-action';

export function useLeaveEmailAction({ action, error, decisionUrl, token }: LeaveApprovalActionProps) {
    const started = useRef(false);
    const form = useForm({ token: token ?? '', rejection_reason: '' });
    const { post } = form;

    useEffect(() => {
        if (action !== 'approve' || error || !decisionUrl || started.current) {
            return;
        }

        started.current = true;
        post(decisionUrl, { preserveScroll: true });
    }, [action, error, decisionUrl, post]);

    return form;
}
