export function approvalDisplayStatus(status: string, requirement: string, hasApproval: boolean): string {
    if (requirement === 'any' && hasApproval && (status === 'pending' || status === 'waiting')) {
        return 'closed';
    }

    return status;
}
