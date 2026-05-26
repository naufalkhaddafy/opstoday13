<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->getRoleNames()->first(),
            'company' => $this->whenLoaded('company', fn () => $this->company === null ? null : [
                'id' => $this->company->id,
                'name' => $this->company->name,
            ]),
            'active_assignment' => $this->relationLoaded('activeShiftAssignment') && $this->activeShiftAssignment ? [
                'id' => $this->activeShiftAssignment->id,
                'days_of_week' => $this->activeShiftAssignment->days_of_week,
                'shift' => $this->activeShiftAssignment->shift ? [
                    'id' => $this->activeShiftAssignment->shift->id,
                    'name' => $this->activeShiftAssignment->shift->name,
                    'code' => $this->activeShiftAssignment->shift->code,
                ] : null,
            ] : null,
            'is_active' => $this->is_active,
            'is_verified' => $this->is_verified,
            'created_at' => $this->created_at,
        ];
    }
}
