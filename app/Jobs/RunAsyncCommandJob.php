<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class RunAsyncCommandJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Tentukan timeout yang cukup panjang untuk sinkronisasi tiket.
     */
    public $timeout = 1800; // 30 minutes

    public function __construct(
        public string $command,
        public string $cacheKey
    ) {}

    public function handle(): void
    {
        Cache::put("cmd_progress:{$this->cacheKey}", [
            'status' => 'running',
            'progress' => 0,
            'message' => "Menjalankan perintah {$this->command}...",
        ], 600);

        try {
            // Eksekusi artisan command
            Artisan::call($this->command);
            $output = Artisan::output();
            
            Cache::put("cmd_progress:{$this->cacheKey}", [
                'status' => 'completed',
                'progress' => 100,
                'message' => "Selesai:\n" . mb_substr(trim($output ?: 'Berhasil dijalankan.'), 0, 3000),
            ], 600);
        } catch (\Throwable $e) {
            Cache::put("cmd_progress:{$this->cacheKey}", [
                'status' => 'error',
                'progress' => 0,
                'message' => "Gagal: " . $e->getMessage(),
            ], 600);
        }
    }
}
