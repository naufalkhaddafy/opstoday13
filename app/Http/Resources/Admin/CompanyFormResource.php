<?php

namespace App\Http\Resources\Admin;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyFormResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'company' => isset($this->resource['company'])
                ? [
                    'id' => $this->resource['company']->id,
                    'name' => $this->resource['company']->name,
                    'whatsapp_group_number' => $this->resource['company']->whatsapp_group_number,
                ]
                : null,
        ];
    }
}
