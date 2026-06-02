<?php

namespace App\Http\Requests;

use App\Enums\RoleName;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserLeaveRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'type' => ['required', 'string', 'in:cuti,sakit,izin'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'description' => ['nullable', 'string', 'max:500'],
        ];

        // Only admins can select which user the leave is for.
        // Engineers can only request for themselves.
        if ($this->user()->hasRole(RoleName::SuperAdmin->value) || $this->user()->hasRole(RoleName::Supv->value)) {
            $rules['user_id'] = ['required', 'exists:users,id'];
        }

        return $rules;
    }
}
