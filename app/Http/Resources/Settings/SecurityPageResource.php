<?php

namespace App\Http\Resources\Settings;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SecurityPageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'canManageTwoFactor' => $this->resource['canManageTwoFactor'],
            'passwordRules' => $this->resource['passwordRules'],
            'twoFactorEnabled' => $this->when(
                $this->resource['canManageTwoFactor'],
                $this->resource['twoFactorEnabled'],
            ),
            'requiresConfirmation' => $this->when(
                $this->resource['canManageTwoFactor'],
                $this->resource['requiresConfirmation'],
            ),
        ];
    }
}
