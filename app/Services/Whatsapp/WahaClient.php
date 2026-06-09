<?php

namespace App\Services\Whatsapp;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WahaClient
{
    /**
     * Kirim pesan teks ke WhatsApp via WAHA API.
     */
    public function sendText(string $chatId, string $text): bool
    {
        $baseUrl = config('services.waha.api_url');

        if (empty($baseUrl)) {
            Log::warning('WAHA API URL is not configured, skipping WhatsApp send.');
            return false;
        }

        $url = rtrim($baseUrl, '/') . '/api/sendText';

        try {
            $response = Http::acceptJson()
                ->withHeaders([
                    'X-Api-Key' => config('services.waha.api_key', ''),
                ])
                ->timeout(15)
                ->retry(2, 500)
                ->post($url, [
                    'chatId' => $chatId,
                    'text' => $text,
                    'linkPreview' => false,
                    'session' => config('services.waha.session', 'default'),
                ]);

            if ($response->successful()) {
                Log::info('WhatsApp message sent', ['chatId' => $chatId]);
                return true;
            }

            Log::error('WAHA API send failed', [
                'chatId' => $chatId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('WAHA API exception', [
                'chatId' => $chatId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
