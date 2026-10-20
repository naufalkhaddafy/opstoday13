<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserLeaveResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'user_id' => $this->resource->user_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id'          => $this->resource->user->id,
                'name'        => $this->resource->user->name,
                'employee_id' => $this->resource->user->employee_id,
                'company'     => $this->resource->user->relationLoaded('company') ? [
                    'name'              => $this->resource->user->company?->name,
                    'approval_settings' => $this->resource->user->company ? [
                        'rule_name'     => $this->resource->user->company->resolveLeaveApprovalRule($this->resource->user->group_id)['name'],
                        'workflow_type' => $this->resource->user->company->resolveLeaveApprovalRule($this->resource->user->group_id)['workflow_type'],
                        'requirement'   => $this->resource->user->company->resolveLeaveApprovalRule($this->resource->user->group_id)['requirement'],
                    ] : null,
                ] : null,
            ]),
            'start_date' => $this->resource->start_date->toDateString(),
            'end_date' => $this->resource->end_date->toDateString(),
            'type' => $this->resource->type,
            'description' => $this->resource->description,
            'status' => $this->resource->status,
            'approvals' => $this->whenLoaded('approvals', fn () =>
                $this->resource->approvals
                    ->sortBy('step_order')
                    ->values()
                    ->map(fn ($approval) => [
                        'id'               => $approval->id,
                        'step_order'       => $approval->step_order,
                        'approver_name'    => $approval->approver?->name ?? 'Unknown',
                        'status'           => $approval->status,
                        'approved_at'      => $approval->approved_at?->toIso8601String(),
                        'rejection_reason' => $approval->rejection_reason,
                    ])
            ),
        ];
    }
}
