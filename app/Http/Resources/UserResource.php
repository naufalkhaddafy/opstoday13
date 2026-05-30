<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
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
            'email_verified_at' => $this->email_verified_at,
            'is_verified' => $this->is_verified,
            'is_active' => $this->is_active,
            'last_active_at' => $this->last_active_at,
            'role' => $this->getRoleNames()->first(),
            'company' => $this->whenLoaded('company', fn () => $this->company === null ? null : [
                'id' => $this->company->id,
                'name' => $this->company->name,
                'slug' => $this->company->slug,
                'whatsapp_group_number' => $this->company->whatsapp_group_number,
            ]),
            'group' => $this->whenLoaded('group', fn () => $this->group === null ? null : [
                'id' => $this->group->id,
                'name' => $this->group->name,
                'slug' => $this->group->slug,
            ]),
            'two_factor_enabled' => $this->hasEnabledTwoFactorAuthentication(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
