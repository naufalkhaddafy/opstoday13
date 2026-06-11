<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = [
        'date',
        'name',
        'is_recurrent',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_recurrent' => 'boolean',
        ];
    }
}
