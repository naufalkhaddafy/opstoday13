<?php

namespace App\Http\Resources\Admin;

use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Shift */
class ShiftListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'company' => $this->whenLoaded('company', fn () => [
                'id' => $this->company->id,
                'name' => $this->company->name,
            ]),
            'time_window' => $this->start_time . ' - ' . $this->end_time,
            'is_overnight' => $this->is_overnight,
            'type' => $this->type->value,
            'assignments_count' => $this->assignments_count ?? 0,
        ];
    }
}
