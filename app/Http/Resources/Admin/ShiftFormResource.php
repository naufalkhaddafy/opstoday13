<?php

namespace App\Http\Resources\Admin;

use App\Enums\ShiftType;
use App\Enums\ShiftWorkDateRule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftFormResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {

        return [
            'shift' => isset($this->resource['shift'])
                ? [
                    'id' => $this->resource['shift']->id,
                    'code' => $this->resource['shift']->code,
                    'name' => $this->resource['shift']->name,
                    // Strip the seconds from time strings if needed for HTML time inputs
                    'start_time' => substr($this->resource['shift']->start_time, 0, 5),
                    'end_time' => substr($this->resource['shift']->end_time, 0, 5),
                    'is_overnight' => (bool) $this->resource['shift']->is_overnight,
                    'work_date_rule' => $this->resource['shift']->work_date_rule->value,
                    'grace_minutes' => $this->resource['shift']->grace_minutes,
                    'type' => $this->resource['shift']->type->value,
                ]
                : null,
            'enums' => [
                'types' => collect(ShiftType::cases())->map(fn ($case) => [
                    'value' => $case->value,
                    'label' => ucfirst($case->value),
                ]),
                'work_date_rules' => collect(ShiftWorkDateRule::cases())->map(fn ($case) => [
                    'value' => $case->value,
                    'label' => str_replace('_', ' ', ucfirst($case->value)),
                ]),
            ],
        ];
    }
}
