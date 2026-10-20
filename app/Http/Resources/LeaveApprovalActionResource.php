<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveApprovalActionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $completed = $this->resource['completed'] ?? false;
        $approval = $this->resource['approval'];

        return [
            'action' => $request->route('action') ?? 'approve',
            'error' => $this->resource['error'],
            'engineer' => $this->resource['approval']->leave->user->name,
            'startDate' => $this->resource['approval']->leave->start_date->format('d M Y'),
            'endDate' => $this->resource['approval']->leave->end_date->format('d M Y'),
            'decisionUrl' => $this->resource['error'] || $completed ? null : route('leave-approval-actions.store', [
                'approval' => $this->resource['approval']->id,
                'action' => $request->route('action'),
            ]),
            'token' => $this->resource['error'] || $completed ? null : $request->query('token'),
            'approvalResult' => $completed ? [
                'approver' => $approval->approver->name,
                'approvedAt' => $approval->approved_at?->timezone(config('app.timezone'))->format('d M Y, H:i T'),
                'company' => $approval->leave->user->company?->name ?? '-',
                'leaveType' => $approval->leave->type,
                'description' => $approval->leave->description,
                'leaveStatus' => $approval->leave->status,
            ] : null,
        ];
    }
}
