<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveApprovalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $leave = $this->leave;
        $user = $leave->user;
        $rule = $user?->company?->resolveLeaveApprovalRule($user->group_id) ?? [];

        return [
            'id' => $this->id,
            'step_order' => $this->step_order,
            'total_steps' => $leave->approvals->max('step_order') ?? 1,
            'approver_name' => $this->approver?->name,
            'workflow_type' => $rule['workflow_type'] ?? 'parallel',
            'requirement' => $rule['requirement'] ?? 'any',
            'approval_chain' => $leave->approvals->sortBy('step_order')->values()->map(fn ($step) => [
                'approver_name' => $step->approver?->name,
                'status' => $step->status,
                'step_order' => $step->step_order,
                'acted_at' => $step->approved_at?->toISOString(),
                'rejection_reason' => $step->rejection_reason,
            ])->all(),
            'leave' => [
                'user' => $user ? ['name' => $user->name, 'company' => $user->company ? ['name' => $user->company->name] : null] : null,
                'type' => $leave->type,
                'start_date' => $leave->start_date->toDateString(),
                'end_date' => $leave->end_date->toDateString(),
                'description' => $leave->description,
            ],
        ];
    }
}
