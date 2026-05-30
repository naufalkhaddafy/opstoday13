<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserShiftException;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RosterExceptionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'date' => ['required', 'date'],
            'shift_id' => ['nullable', 'integer', Rule::exists('shifts', 'id')],
        ]);

        $date = CarbonImmutable::parse($validated['date'])->toDateString();

        UserShiftException::updateOrCreate(
            ['user_id' => $validated['user_id'], 'date' => $date],
            ['shift_id' => $validated['shift_id']]
        );

        return back()->with('success', 'Jadwal spesifik berhasil disimpan.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'date' => ['required', 'date'],
        ]);

        $date = CarbonImmutable::parse($validated['date'])->toDateString();

        UserShiftException::where('user_id', $validated['user_id'])
            ->where('date', $date)
            ->delete();

        return back()->with('success', 'Jadwal spesifik berhasil dihapus, kembali ke jadwal reguler.');
    }
}
