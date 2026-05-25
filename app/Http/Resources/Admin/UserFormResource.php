<?php

namespace App\Http\Resources\Admin;

use App\Enums\RoleName;
use App\Http\Resources\UserResource;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserFormResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'user' => isset($this->resource['user'])
                ? UserResource::make($this->resource['user'])->resolve()
                : null,
            'companies' => Company::select('id', 'name')->get()->toArray(),
            'roles' => array_column(RoleName::cases(), 'value'),
        ];
    }
}
