<?php

namespace App\Http\Resources\Settings;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfilePageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'mustVerifyEmail' => $this->resource['mustVerifyEmail'],
            'status' => $this->resource['status'],
        ];
    }
}
