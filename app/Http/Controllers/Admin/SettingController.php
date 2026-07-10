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

        // Pengecualian: AI Backfill tetap menggunakan exec karena memakan waktu berjam-jam (rawan timeout di Queue Worker standar)
        if ($command === 'ops:backfill-ai-tickets --force') {
            // Ambil setting batas hari dari database lalu sertakan secara eksplisit ke command
            $days = $this->settings->get('ai_backfill_days', 30);
            $finalCommand = "{$command} --days={$days}";

            Cache::put('cmd_progress:ops_backfill', [
                'status' => 'starting',
                'progress' => 0,
                'message' => 'Sedang menyiapkan AI Engine..',
            ], 600);
            
            // Run async for AI Backfill (Cross-Platform Detached Process)
            $base = base_path();
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                pclose(popen("start /B cmd /C \"cd /d {$base} && php artisan {$finalCommand} > NUL 2> NUL\"", "r"));
            } else {
                // Compatible with FrankenPHP/Alpine which might not have `nohup`
                exec("cd {$base} && php artisan {$finalCommand} > /dev/null 2>&1 &");
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => "Command {$finalCommand} started in background."]);
            return back();
        }

        // Untuk fitur test scheduler lainnya (Sinkronisasi Tiket, WA, Absensi)
        // Kita menggunakan Laravel Job Queue (berjalan di background)
        $cacheKey = str_replace([':', ' ', '-'], '_', $command);
        
        Cache::put("cmd_progress:{$cacheKey}", [
            'status' => 'starting',
            'progress' => 0,
            'message' => 'Menambahkan perintah ke antrean (Queue)...',
        ], 600);

        \App\Jobs\RunAsyncCommandJob::dispatch($command, $cacheKey);
        
        Inertia::flash('toast', ['type' => 'success', 'message' => "Command {$command} diantrekan (Queue) di background."]);
        return back();
    }

    public function checkCommandStatus(Request $request)
    {
        $keys = $request->input('keys');
        if ($keys) {
            $keyArray = explode(',', $keys);
            $results = [];
            foreach ($keyArray as $k) {
                $results[$k] = Cache::get("cmd_progress:{$k}", ['status' => 'idle']);
            }
            return response()->json($results);
        }

        // Fallback untuk backward compatibility
        $key = $request->input('key', 'ops_backfill');
        return response()->json(Cache::get("cmd_progress:{$key}", ['status' => 'idle']));
    }
}
