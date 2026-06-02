<?php

namespace App\Http\Resources\Admin;

use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->getRoleNames()->first(),
            'company' => $this->whenLoaded('company', fn () => $this->company === null ? null : [
                'id' => $this->company->id,
                'name' => $this->company->name,
            ]),
            'group' => $this->whenLoaded('group', fn () => $this->group === null ? null : [
                'id' => $this->group->id,
                'name' => $this->group->name,
            ]),
            'active_assignment' => (function () {
                $activeAssignment = $this->relationLoaded('activeShiftAssignment') ? $this->activeShiftAssignment : null;
                if (! $activeAssignment) {
                    return null;
                }

                $schedule = $activeAssignment->schedule;
                $activeDays = [];
                $shiftIds = [];
                if (is_array($schedule)) {
                    foreach ($schedule as $day => $shiftId) {
                        if ($shiftId !== null) {
                            $activeDays[] = (int) $day;
                            $shiftIds[] = (int) $shiftId;
                        }
                    }
                }
                sort($activeDays);

                $shiftIds = array_unique($shiftIds);
                $shifts = Shift::query()->whereIn('id', $shiftIds)->get();

                if ($shifts->isEmpty()) {
                    $shiftName = 'Libur';
                    $shiftCode = 'Libur';
                } elseif ($shifts->count() === 1) {
                    $firstShift = $shifts->first();
                    $shiftName = $firstShift->name;
                    $shiftCode = $firstShift->code;
                } else {
                    $shiftName = 'Jadwal Campuran';
                    $shiftCode = 'Campuran';
                }

                return [
                    'id' => $activeAssignment->id,
                    'days_of_week' => $activeDays,
                    'shift' => [
                        'id' => 0,
                        'name' => $shiftName,
                        'code' => $shiftCode,
                    ],
                ];
            })(),
            'is_active' => $this->is_active,
            'is_verified' => $this->is_verified,
            'created_at' => $this->created_at,
        ];
    }
}
