<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && !auth()->user()->is_verified;
    }

    public function rules(): array
    {
        return [
            'employee_id' => [
                'required',
                'string',
                'max:255',
                'unique:users,employee_id',
            ],
            'company_id' => [
                'required',
                'exists:companies,id',
            ],
            'group_id' => [
                'required',
                'exists:groups,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.unique' => 'ID Karyawan ini sudah terdaftar di sistem. Harap gunakan ID lain atau hubungi administrator.',
            'employee_id.required' => 'ID Karyawan wajib diisi.',
            'company_id.required' => 'Perusahaan wajib dipilih.',
            'group_id.required' => 'Tim / Grup wajib dipilih.',
        ];
    }
}
