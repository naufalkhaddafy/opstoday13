<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class SessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn() => $this->user->name, 'Unknown'),
            'user_email' => $this->whenLoaded('user', fn() => $this->user->email, 'Unknown'),
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'last_activity_raw' => $this->last_activity,
            'last_activity_human' => Carbon::createFromTimestamp($this->last_activity)->diffForHumans(),
            'is_current_device' => $this->id === $request->session()->getId(),
        ];
    }
}
