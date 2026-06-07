<?php

namespace App\Models;

use App\Enums\TicketSyncRunKind;
use App\Enums\TicketSyncRunStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'kind',
    'started_at',
    'finished_at',
    'fetched_count',
    'inserted_count',
    'updated_count',
    'skipped_count',
    'status',
    'error_message',
])]
class TicketSyncRun extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kind' => TicketSyncRunKind::class,
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'status' => TicketSyncRunStatus::class,
            'fetched_count' => 'integer',
            'inserted_count' => 'integer',
            'updated_count' => 'integer',
            'skipped_count' => 'integer',
        ];
    }

    /**
     * @return HasMany<Ticket, $this>
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'sync_batch_id');
    }
}
