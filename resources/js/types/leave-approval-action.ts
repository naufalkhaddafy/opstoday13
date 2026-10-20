export interface LeaveApprovalActionProps {
    action: 'approve' | 'reject';
    error: string | null;
    engineer: string;
    startDate: string;
    endDate: string;
    decisionUrl: string | null;
    token: string | null;
    approvalResult: {
        approver: string;
        approvedAt: string | null;
        company: string;
        leaveType: string;
        description: string | null;
        leaveStatus: string;
    } | null;
}
