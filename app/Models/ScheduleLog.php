<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleLog extends Model
{
    protected $fillable = [
        'command',
        'status',
        'output',
        'metadata',
        'started_at',
        'finished_at',
        'duration',
    ];

    protected $casts = [
        'metadata' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];
}
