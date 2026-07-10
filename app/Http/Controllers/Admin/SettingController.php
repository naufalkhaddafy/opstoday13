<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CheckCommandStatusRequest;
use App\Http\Requests\Admin\TestCommandRequest;
use App\Http\Requests\Admin\UpdateSettingRequest;
use App\Http\Resources\Admin\SettingsPageResource;
use App\Repositories\Contracts\SettingRepositoryInterface;
use App\Services\System\CommandExecutionService;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function __construct(
        private readonly SettingRepositoryInterface $settings,
        private readonly CommandExecutionService $commandService
    ) {}

    public function index()
    {
        $groupedSettings = $this->settings->getAllGrouped();

        return Inertia::render(
            'admin/settings/Index',
            SettingsPageResource::make([
                'grouped_settings' => $groupedSettings
            ])->resolve()
        );
    }

    public function update(UpdateSettingRequest $request)
    {
        $validated = $request->validated();
        
        if (!empty($validated['settings'])) {
            $this->settings->updateMany($validated['settings']);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Settings updated successfully.']);

        return back();
    }

    public function testCommand(TestCommandRequest $request)
    {
        $message = $this->commandService->executeCommand($request->validated('command'));
        
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);
        return back();
    }

    public function checkCommandStatus(CheckCommandStatusRequest $request)
    {
        $results = $this->commandService->getCommandStatus(
            $request->validated('keys'),
            $request->validated('key') ?? 'ops_backfill'
        );

        return response()->json($results);
    }
}
