<?php

namespace App\Http\Resources;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserLeaveFormResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = [
            'leave' => isset($this->resource['leave']) 
                ? UserLeaveResource::make($this->resource['leave'])->resolve() 
                : null,
            'types' => ['cuti', 'sakit', 'izin'],
        ];

        if ($request->user()->hasRole(RoleName::SuperAdmin->value) || $request->user()->hasRole(RoleName::Supv->value)) {
            $data['users'] = User::select('id', 'name', 'employee_id')->get()->toArray();
            $data['statuses'] = ['pending', 'approved', 'rejected'];
        }

        return $data;
    }
}
