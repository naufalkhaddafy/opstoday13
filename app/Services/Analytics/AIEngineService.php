<?php

namespace App\Services\Analytics;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIEngineService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.ai_engine.url', 'http://127.0.0.1:8002');
    }

    /**
     * Analyze a ticket's text using the Python AI Microservice.
     *
     * @param string $title
     * @param string|null $description
     * @return array{category: string, confidence_score: float}|null
     */
    public function analyzeTicket(string $title, ?string $description = ''): ?array
    {
        try {
            $response = Http::timeout(3)->post("{$this->baseUrl}/analyze-ticket", [
                'title' => $title,
                'description' => $description ?? ''
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('AI Engine returned non-success status', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to communicate with AI Engine', [
                'message' => $e->getMessage()
            ]);
        }

        return null;
    }
}
