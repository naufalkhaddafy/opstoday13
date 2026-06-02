<?php

namespace App\Http\Requests;

use App\Enums\RoleName;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserLeaveRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // We will check authorization in controller or policy
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

        if ($this->user()->hasRole(RoleName::SuperAdmin->value) || $this->user()->hasRole(RoleName::Supv->value)) {
            $rules['user_id'] = ['required', 'exists:users,id'];
            $rules['status'] = ['required', 'in:pending,approved,rejected'];
        }

        return $rules;
    }
}
