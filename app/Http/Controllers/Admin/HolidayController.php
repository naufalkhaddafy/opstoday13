<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\HolidayRequest;
use App\Http\Resources\Admin\HolidayResource;
use App\Repositories\Contracts\HolidayRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function __construct(
        protected HolidayRepositoryInterface $holidayRepository,
    ) {}

    public function index(): Response
    {
        $holidays = $this->holidayRepository->getAll();

        return Inertia::render('admin/holidays/index', [
            'holidays' => HolidayResource::collection($holidays)->resolve(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/holidays/form');
    }

    public function store(HolidayRequest $request): RedirectResponse
    {
        $this->holidayRepository->create($request->validated());

        return redirect()->route('admin.holidays.index')
            ->with('success', 'Holiday created successfully.');
    }

    public function edit(int $id): Response
    {
        $holiday = $this->holidayRepository->findById($id);
        abort_if(! $holiday, 404);

        return Inertia::render('admin/holidays/form', [
            'holiday' => HolidayResource::make($holiday)->resolve(),
        ]);
    }

    public function update(HolidayRequest $request, int $id): RedirectResponse
    {
        $holiday = $this->holidayRepository->findById($id);
        abort_if(! $holiday, 404);

        $this->holidayRepository->update($holiday, $request->validated());

        return redirect()->route('admin.holidays.index')
            ->with('success', 'Holiday updated successfully.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $holiday = $this->holidayRepository->findById($id);
        abort_if(! $holiday, 404);

        $this->holidayRepository->delete($holiday);

        return redirect()->route('admin.holidays.index')
            ->with('success', 'Holiday deleted successfully.');
    }
}
