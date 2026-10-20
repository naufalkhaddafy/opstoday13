<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LeaveApprovalDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can($this->routeIs('leave-approval-actions.*') ? 'emailAction' : 'decide', $this->route('approval'));
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => [$this->route('action') === 'reject' || $this->routeIs('admin.leave-approvals.reject') ? 'required' : 'nullable', 'string', 'max:500'],
            'token' => [$this->routeIs('leave-approval-actions.*') ? 'required' : 'nullable', 'string', 'size:64'],
        ];
    }
}
