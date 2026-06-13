<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketAIPrediction extends Model
{
    protected $table = 'ticket_ai_predictions';

    protected $fillable = [
        'ticket_id',
        'category',
        'keyword',
        'confidence_score',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
