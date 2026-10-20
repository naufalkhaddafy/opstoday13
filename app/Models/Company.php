<?php

namespace App\Models;

use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable(['name', 'slug', 'whatsapp_groups', 'leave_approval_settings'])]
class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory, LogsActivity;

    protected function casts(): array
    {
        return [
            'whatsapp_groups' => 'array',
            'leave_approval_settings' => 'array',
        ];
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Resolve the applicable leave approval rule for a specific user group.
     *
     * @return array{id: string, name: string, workflow_type: string, requirement: string, approver_ids: array, is_default: bool, group_ids: array}
     */
    public function resolveLeaveApprovalRule(?int $userGroupId = null): array
    {
        $settings = $this->leave_approval_settings;
        if (!is_array($settings)) {
            return [
                'id' => 'default',
                'name' => 'Default',
                'workflow_type' => 'parallel',
                'requirement' => 'any',
                'approver_ids' => [],
                'is_default' => true,
                'group_ids' => [],
            ];
        }

        if (!empty($settings['rules']) && is_array($settings['rules'])) {
            $rules = $settings['rules'];

            // Priority 1: Match user group
            if ($userGroupId) {
                foreach ($rules as $rule) {
                    $groupIds = $rule['group_ids'] ?? [];
                    if (is_array($groupIds) && in_array($userGroupId, array_map('intval', $groupIds))) {
                        return $this->formatApprovalRule($rule);
                    }
                }
            }

            // Priority 2: Fallback to default rule
            foreach ($rules as $rule) {
                if (!empty($rule['is_default'])) {
                    return $this->formatApprovalRule($rule);
                }
            }

            // Priority 3: Fallback to first rule
            if (isset($rules[0])) {
                return $this->formatApprovalRule($rules[0]);
            }
        }

        // Backward compatibility: old single rule format
        if (isset($settings['workflow_type'])) {
            return $this->formatApprovalRule($settings);
        }

        return [
            'id' => 'default',
            'name' => 'Default',
            'workflow_type' => 'parallel',
            'requirement' => 'any',
            'approver_ids' => [],
            'is_default' => true,
            'group_ids' => [],
        ];
    }

    private function formatApprovalRule(array $rule): array
    {
        $requirement = $rule['requirement'] ?? 'any';
        // When requirement is 'any', workflow_type is forced to 'parallel'
        $workflowType = ($requirement === 'any') ? 'parallel' : ($rule['workflow_type'] ?? 'parallel');

        return [
            'id' => (string) ($rule['id'] ?? 'default'),
            'name' => (string) ($rule['name'] ?? 'Aturan Persetujuan'),
            'workflow_type' => $workflowType,
            'requirement' => $requirement,
            'approver_ids' => array_values(array_filter(array_map('intval', $rule['approver_ids'] ?? []))),
            'is_default' => (bool) ($rule['is_default'] ?? false),
            'group_ids' => array_values(array_filter(array_map('intval', $rule['group_ids'] ?? []))),
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
