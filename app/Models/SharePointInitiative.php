<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SharePointInitiative extends Model
{
    use HasFactory;

    protected $table = 'sharepoint_initiatives';

    protected $fillable = [
        'sharepoint_item_id',
        'title',
        'status',
        'impact_level',
        'target_timeline',
        'submission_date',
        'raw_data'
    ];

    protected $casts = [
        'submission_date' => 'date',
        'raw_data' => 'array',
    ];

    /**
     * Get the users associated with the initiative.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'initiative_user', 'sharepoint_initiative_id', 'user_id');
    }
}
