<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupFormResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'group' => isset($this->resource['group']) ? [
                'id' => $this->resource['group']->id,
                'name' => $this->resource['group']->name,
            ] : null,
        ];
    }
}
