<?php

namespace App\Models;

use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'ticket_no',
    'category',
    'sub_category',
    'title',
    'computer_name',
    'requested_for',
    'requested_by',
    'status',
    'assigned_to_name',
    'assigned_to_id',
    'assigned_to_user_id',
    'work_group',
    'first_seen_at',
    'status_changed_at',
    'disappeared_at',
    'in_progress_at',
    'response_time_seconds',
    'dispatch_time_seconds',
    'api_creation_date',
    'completed_date',
    'resolution_time',
    'last_synced_at',
    'sync_batch_id',
])]
class Ticket extends Model
{
    protected $appends = ['pending_time_seconds'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'first_seen_at' => 'datetime',
            'status_changed_at' => 'datetime',
            'disappeared_at' => 'datetime',
            'in_progress_at' => 'datetime',
            'response_time_seconds' => 'integer',
            'dispatch_time_seconds' => 'integer',
            'api_creation_date' => 'date',
            'completed_date' => 'date',
            'last_synced_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    /**
     * @return BelongsTo<TicketSyncRun, $this>
     */
    public function syncRun(): BelongsTo
    {
        return $this->belongsTo(TicketSyncRun::class, 'sync_batch_id');
    }

    /**
     * @return HasMany<TicketAssignmentHistory, $this>
     */
    public function assignmentHistories(): HasMany
    {
        return $this->hasMany(TicketAssignmentHistory::class);
    }

    public function aiPrediction()
    {
        return $this->hasOne(TicketAIPrediction::class);
    }

    public function getPendingTimeSecondsAttribute(): int
    {
        $creation = $this->api_creation_date;
        
        if ($this->first_seen_at) {
            if (! $creation) {
                $creation = $this->first_seen_at;
            } elseif ($creation->isSameDay($this->first_seen_at)) {
                // Trik Pintar: Jika harinya sama, gunakan first_seen_at karena punya data JAM yang lebih akurat
                $creation = $this->first_seen_at;
            }
        }

        $completion = $this->completed_date;
        
        if ($this->status_changed_at) {
            if (! $completion) {
                $completion = $this->status_changed_at;
            } elseif ($completion->isSameDay($this->status_changed_at)) {
                // Trik Pintar: Jika harinya sama, gunakan status_changed_at karena punya data JAM yang lebih akurat
                $completion = $this->status_changed_at;
            }
        }
        
        $completion = $completion ?? now();

        if (! $creation) {
            return 0;
        }

        $totalSeconds = max(0, $creation->diffInSeconds($completion));
        $dispatchSeconds = $this->dispatch_time_seconds ?? 0;
        $responseSeconds = $this->response_time_seconds ?? 0;
        $resolutionSeconds = (int) (($this->resolution_time ?? 0) * 3600);

        return max(0, $totalSeconds - $dispatchSeconds - $responseSeconds - $resolutionSeconds);
    }
}
