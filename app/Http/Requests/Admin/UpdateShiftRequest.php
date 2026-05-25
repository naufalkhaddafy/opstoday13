<?php

namespace App\Http\Requests\Admin;

use App\Enums\ShiftType;
use App\Enums\ShiftWorkDateRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateShiftRequest extends FormRequest
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
            'company_id' => ['required', 'exists:companies,id'],
            'code' => ['required', 'string', 'max:50', Rule::unique('shifts')->ignore($this->route('shift'))],
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'is_overnight' => ['boolean'],
            'work_date_rule' => ['required', Rule::enum(ShiftWorkDateRule::class)],
            'grace_minutes' => ['nullable', 'integer', 'min:0'],
            'type' => ['required', Rule::enum(ShiftType::class)],
        ];
    }
}
