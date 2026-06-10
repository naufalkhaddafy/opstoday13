<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class VerifyUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('super_admin') || $this->user()->hasRole('supv');
    }

    public function rules(): array
    {
        return [
            'employee_id' => [
                'required',
                'string',
                'max:255',
                'unique:users,employee_id,' . $this->route('user')->id,
            ],
            'company_id' => [
                'required',
                'exists:companies,id',
            ],
            'group_id' => [
                'required',
                'exists:groups,id',
            ],
            'role' => [
                'required',
                'string',
                'exists:roles,name',
            ],
        ];
    }
}
