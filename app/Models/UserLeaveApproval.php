<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLeaveApproval extends Model
{
    protected $fillable = [
        'user_leave_id',
        'approver_id',
        'status',
        'step_order',
        'approved_at',
        'rejection_reason',
        'email_token_hash',
        'email_token_expires_at',
        'email_token_used_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'email_token_expires_at' => 'datetime',
        'email_token_used_at' => 'datetime',
    ];

    protected $hidden = ['email_token_hash', 'email_token_expires_at', 'email_token_used_at'];

    public function leave(): BelongsTo
    {
        return $this->belongsTo(UserLeave::class, 'user_leave_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
