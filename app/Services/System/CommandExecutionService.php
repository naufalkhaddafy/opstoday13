<?php

namespace App\Services\System;

use App\Repositories\Contracts\SettingRepositoryInterface;
use Illuminate\Support\Facades\Cache;

class CommandExecutionService
{
    public function __construct(
        private readonly SettingRepositoryInterface $settings
    ) {}

    /**
     * Execute a scheduled command either synchronously via OS process or asynchronously via Queue.
     */
    public function executeCommand(string $command): string
    {
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

            return "Command {$finalCommand} started in background.";
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
        
        return "Command {$command} diantrekan (Queue) di background.";
    }

    /**
     * Get the status of one or multiple commands from Cache.
     */
    public function getCommandStatus(?string $keys, string $fallbackKey = 'ops_backfill'): array|object
    {
        if ($keys) {
            $keyArray = explode(',', $keys);
            $results = [];
            foreach ($keyArray as $k) {
                $results[$k] = Cache::get("cmd_progress:{$k}", ['status' => 'idle']);
            }
            return $results;
        }

        // Fallback untuk backward compatibility
        return Cache::get("cmd_progress:{$fallbackKey}", ['status' => 'idle']);
    }
}
