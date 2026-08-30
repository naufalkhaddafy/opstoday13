<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TestCommandRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Controller route is already protected by 'role:super_admin' middleware
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'command' => [
                'required',
                'string',
                'in:ops:send-snapshot morning,ops:send-snapshot evening,tickets:sync-open,tickets:sync-completed,attendance:sync,ops:backfill-ai-tickets --force,opstoday:sync-sharepoint,opstoday:sync-sharepoint --type=initiatives',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'command.in' => 'Command not allowed.',
        ];
    }
}
