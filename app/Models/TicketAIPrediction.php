<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketAIPrediction extends Model
{
    protected $table = 'ticket_ai_predictions';

    protected $fillable = [
        'ticket_id',
        'cluster_id',
        'cluster_label',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
