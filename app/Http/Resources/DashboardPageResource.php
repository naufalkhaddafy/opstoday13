<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\Attendance\DailyAttendanceSummarizer;
use App\Services\Attendance\ShiftAssignmentResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardPageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, User> */
        $users = $this->resource['users'];
        /** @var CarbonImmutable */
        $today = $this->resource['today'];
        /** @var ShiftAssignmentResolver */
        $shiftResolver = $this->resource['shiftResolver'];

        $summary = (new DailyAttendanceSummarizer())->summarize($users, $today, $today, $shiftResolver);

        return [
            'stats' => $summary['stats'],
            'employeeStatuses' => $summary['employees'],
            'date' => $today->translatedFormat('l, d F Y'),
        ];
    }
}
