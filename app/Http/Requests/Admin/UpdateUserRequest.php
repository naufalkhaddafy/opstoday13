<?php

namespace App\Http\Requests\Admin;

use App\Enums\RoleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($userId)],
            'employee_id' => ['nullable', 'string', 'max:50', Rule::unique('users')->ignore($userId)],
            'company_id' => ['nullable', 'integer', Rule::exists('companies', 'id')],
            'role' => ['required', 'string', Rule::in(array_column(RoleName::cases(), 'value'))],
            'is_active' => ['boolean'],
            'is_verified' => ['boolean'],
            
            // Shift Assignment Fields
            'shift_id' => ['nullable', 'integer', Rule::exists('shifts', 'id')],
            'shift_effective_from' => ['required_with:shift_id', 'date'],
            'shift_effective_to' => ['nullable', 'date', 'after_or_equal:shift_effective_from'],
            'shift_days_of_week' => ['nullable', 'array'],
            'shift_days_of_week.*' => ['integer', 'min:1', 'max:7'],
        ];
    }
}
