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
        $activeAssignment = null;
        if (isset($this->resource['user'])) {
            $user = $this->resource['user'];
            $assignment = $user->shiftAssignments()
                ->where(function ($query) {
                    $query->whereNull('effective_to')
                        ->orWhere('effective_to', '>=', now()->toDateString());
                })
                ->orderByDesc('effective_from')
                ->first();

            if ($assignment) {
                $activeAssignment = [
                    'id' => $assignment->id,
                    'shift_id' => $assignment->shift_id,
                    'effective_from' => $assignment->effective_from->toDateString(),
                    'effective_to' => $assignment->effective_to?->toDateString(),
                    'days_of_week' => $assignment->days_of_week,
                ];
            }
        }

        return [
            'user' => isset($this->resource['user'])
                ? array_merge(
                    UserResource::make($this->resource['user'])->resolve(),
                    ['active_shift_assignment' => $activeAssignment]
                )
                : null,
            'companies' => Company::select('id', 'name')->get()->toArray(),
            'shifts' => \App\Models\Shift::select('id', 'name', 'code')->get()->toArray(),
            'roles' => array_column(RoleName::cases(), 'value'),
        ];
    }
}
