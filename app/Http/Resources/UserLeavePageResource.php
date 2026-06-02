<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserLeavePageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'leaves' => UserLeaveResource::collection($this->resource['leaves']),
            'meta' => [
                'current_page' => $this->resource['leaves']->currentPage(),
                'last_page' => $this->resource['leaves']->lastPage(),
                'per_page' => $this->resource['leaves']->perPage(),
                'total' => $this->resource['leaves']->total(),
            ],
            'filters' => $this->resource['filters'] ?? [],
        ];
    }
}
