<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingRequest;
use App\Http\Resources\Admin\SettingsPageResource;
use App\Repositories\Contracts\SettingRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Process;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function __construct(
        private readonly SettingRepositoryInterface $settings
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

    public function testCommand(Request $request)
    {
        $command = $request->input('command');
        
        $allowedCommands = [
            'ops:send-snapshot morning',
            'ops:send-snapshot evening',
            'tickets:sync-open',
            'tickets:sync-completed',
            'attendance:sync',
            'ops:backfill-ai-tickets --force',
        ];

        if (!in_array($command, $allowedCommands, true)) {
            return back()->with('toast', ['type' => 'error', 'message' => 'Command not allowed.']);
        }

        if ($command === 'ops:backfill-ai-tickets --force') {
            Cache::put('cmd_progress:ops_backfill', [
                'status' => 'starting',
                'progress' => 0,
                'message' => 'Sedang menyiapkan AI Engine...',
            ], 600);
            
            // Run async for AI Backfill (Cross-Platform Detached Process)
            $base = base_path();
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                pclose(popen("start /B cmd /C \"cd /d {$base} && php artisan {$command} > NUL 2> NUL\"", "r"));
            } else {
                // Compatible with FrankenPHP/Alpine which might not have `nohup`
                exec("cd {$base} && php artisan {$command} > /dev/null 2>&1 &");
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => "Command {$command} started in background."]);
            return back();
        }

        // Jalankan perintah lainnya secara synchronous agar tuntas (seperti kirim WA)
        try {
            Artisan::call($command);
            Inertia::flash('toast', ['type' => 'success', 'message' => "Command {$command} executed successfully."]);
        } catch (\Exception $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "Command failed: " . $e->getMessage()]);
        }

        return back();
    }

    public function checkCommandStatus(Request $request)
    {
        $key = $request->input('key', 'ops_backfill');
        return response()->json(Cache::get("cmd_progress:{$key}", ['status' => 'idle']));
    }
}
