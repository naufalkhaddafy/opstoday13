<?php

namespace App\Http\Requests\Admin;

use App\Enums\RoleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')],
            'employee_id' => ['nullable', 'string', 'max:50', Rule::unique('users')],
            'company_id' => ['nullable', 'integer', Rule::exists('companies', 'id')],
            'role' => ['required', 'string', Rule::in(array_column(RoleName::cases(), 'value'))],
            'password' => ['required', Password::defaults(), 'confirmed'],
            'is_active' => ['boolean'],
            'is_verified' => ['boolean'],
        ];
    }
}
