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
                'id' => $this->resource->user->id,
                'name' => $this->resource->user->name,
                'employee_id' => $this->resource->user->employee_id,
            ]),
            'start_date' => $this->resource->start_date->toDateString(),
            'end_date' => $this->resource->end_date->toDateString(),
            'type' => $this->resource->type,
            'description' => $this->resource->description,
            'status' => $this->resource->status,
        ];
    }
}
