<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class SharePointData extends Model
{
    protected $table = 'sharepoint_data';

    protected $fillable = [
        'site_id',
        'list_id',
        'sharepoint_item_id',
        'type',
        'data',
        'last_synced_at',
    ];

    protected $casts = [
        'data' => 'array',
        'last_synced_at' => 'datetime',
    ];

    protected $appends = [
        'title',
        'pic',
        'submitted_by',
        'initiative_status',
        'target_timeline',
        'impact_level',
    ];

    /**
     * Scope query by type (e.g., 'initiative', 'milestone', etc.).
     */
    public function scopeOfType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }

    /**
     * Scope query by SharePoint site and list ID.
     */
    public function scopeFromSource(Builder $query, ?string $siteId, ?string $listId): void
    {
        if ($siteId !== null) {
            $query->where('site_id', $siteId);
        }

        if ($listId !== null) {
            $query->where('list_id', $listId);
        }
    }

    /**
     * Helper to get a field value from the JSON payload.
     */
    public function getField(string $key, mixed $default = null): mixed
    {
        return $this->data[$key] ?? $default;
    }

    /**
     * Helper to extract a readable name from SharePoint person/user field in JSON data.
     */
    protected function extractPersonName(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value) && trim($value) !== '') {
            return trim($value);
        }

        if (is_array($value)) {
            $first = $value[0] ?? $value;
            if (is_array($first)) {
                $name = $first['LookupValue'] ?? $first['Email'] ?? $first['Title'] ?? $first['Name'] ?? null;
                if (is_string($name) && trim($name) !== '') {
                    return trim($name);
                }
            }
        }

        return null;
    }

    /**
     * Convenience accessor for Title.
     */
    public function getTitleAttribute(): ?string
    {
        return $this->getField('Title');
    }

    /**
     * Convenience accessor for PIC (Person in charge / Engineer).
     */
    public function getPicAttribute(): ?string
    {
        $keys = [
            'PIC',
            'PIC / Engineer',
            'Engineer',
            'Assignee',
            'AssignedTo',
            'Assigned To',
            'SubmittedBy',
            'Submitted By',
            'Author',
            'Owner',
            'Lead',
            'PICName',
            'PIC_Name',
        ];

        foreach ($keys as $key) {
            $name = $this->extractPersonName($this->getField($key));
            if ($name !== null) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Convenience accessor for Submitted By.
     */
    public function getSubmittedByAttribute(): ?string
    {
        $submitted = $this->getField('SubmittedBy') ?? $this->getField('Submitted By');
        if (is_array($submitted)) {
            $first = $submitted[0] ?? $submitted;
            if (is_array($first)) {
                return $first['LookupValue'] ?? $first['Email'] ?? null;
            }
        }
        if (is_string($submitted) && trim($submitted) !== '') {
            return $submitted;
        }

        return $this->getField('PIC');
    }

    /**
     * Convenience accessor for Initiative Status.
     */
    public function getInitiativeStatusAttribute(): ?string
    {
        return $this->getField('InitiativeStatus')
            ?? $this->getField('Initiative Status')
            ?? $this->getField('ApprovalStatus')
            ?? $this->getField('Approval Status')
            ?? $this->getField('Status');
    }

    /**
     * Convenience accessor for Target Timeline.
     */
    public function getTargetTimelineAttribute(): ?string
    {
        return $this->getField('Target Timeline');
    }

    /**
     * Convenience accessor for Impact Level.
     */
    public function getImpactLevelAttribute(): ?string
    {
        return $this->getField('ImpactLevel')
            ?? $this->getField('Impact Level')
            ?? $this->getField('Impact')
            ?? $this->getField('Priority')
            ?? $this->getField('StrategicImpact')
            ?? $this->getField('Strategic Impact');
    }
}
