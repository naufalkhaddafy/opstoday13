<?php

namespace App\Http\Resources\Admin;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyFormResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $mergedUsers = [];
        $normalizedSettings = [
            'rules' => [
                [
                    'id' => 'rule_default',
                    'name' => 'Aturan Default',
                    'group_ids' => [],
                    'is_default' => true,
                    'workflow_type' => 'parallel',
                    'requirement' => 'any',
                    'approver_ids' => [],
                ],
            ],
        ];

        if (isset($this->resource['company'])) {
            $company = $this->resource['company'];
            
            // Get users for this company
            $companyUsers = $company->users()->select('id', 'name', 'email')->get();
            
            // Get all super admins
            $superAdmins = \App\Models\User::role('super_admin')->select('id', 'name', 'email')->get();
            
            // Merge them and remove duplicates
            $mergedUsers = $companyUsers->merge($superAdmins)->unique('id')->values();

            // Normalize leave approval settings
            $rawSettings = $company->leave_approval_settings;
            if (is_array($rawSettings) && !empty($rawSettings['rules']) && is_array($rawSettings['rules'])) {
                $normalizedSettings = $rawSettings;
            } elseif (is_array($rawSettings) && isset($rawSettings['workflow_type'])) {
                $normalizedSettings = [
                    'rules' => [
                        [
                            'id' => 'rule_default',
                            'name' => 'Aturan Default',
                            'group_ids' => [],
                            'is_default' => true,
                            'workflow_type' => $rawSettings['workflow_type'] ?? 'parallel',
                            'requirement' => $rawSettings['requirement'] ?? 'any',
                            'approver_ids' => $rawSettings['approver_ids'] ?? [],
                        ],
                    ],
                ];
            }
        }

        return [
            'company' => isset($this->resource['company'])
                ? [
                    'id' => $company->id,
                    'name' => $company->name,
                    'whatsapp_groups' => $company->whatsapp_groups ?? [],
                    'leave_approval_settings' => $normalizedSettings,
                    'users' => $mergedUsers,
                ]
                : null,
            'available_groups' => \App\Models\Group::select('id', 'name')->orderBy('name')->get(),
        ];
    }
}
