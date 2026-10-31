<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DashboardFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $groups = $this->input('work_group');
        $this->merge(['work_group' => $groups === null || $groups === 'all' ? [] : (is_array($groups) ? $groups : [$groups])]);
    }

    public function rules(): array
    {
        return [
            'work_group' => ['array', 'max:100'],
            'work_group.*' => ['required', 'string', 'max:255', 'distinct'],
        ];
    }
}
