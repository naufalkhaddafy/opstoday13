<?php

namespace App\Services\Fingerprint;

use App\Contracts\Fingerprint\FingerprintClientInterface;
use App\Enums\AttendanceLogStatus;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HttpFingerprintClient implements FingerprintClientInterface
{
    /**
     * @return list<array{employee_id: string, status: string, punched_at: CarbonImmutable}>
     */
    public function fetch(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $url = config('services.fingerprint.url');
        $token = config('services.fingerprint.token');

        if (empty($url)) {
            return [];
        }

        $response = Http::withToken($token)
            ->acceptJson()
            ->get($url, [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ]);

        if (! $response->successful()) {
            Log::warning('Fingerprint API fetch failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            $response->throw();
        }

        $records = [];
        $timezone = config('app.timezone', 'Asia/Jakarta');

        foreach ($response->json('data', $response->json()) ?? [] as $row) {
            $status = AttendanceLogStatus::tryFromApi($row['status1'] ?? $row['status'] ?? null);

            if ($status === null) {
                continue;
            }

            $punchedAt = CarbonImmutable::parse($row['fdDate'] ?? $row['punched_at'], $timezone);

            $records[] = [
                'employee_id' => (string) ($row['fsIdNo'] ?? $row['employee_id']),
                'status' => $status->value,
                'punched_at' => $punchedAt,
            ];
        }

        return $records;
    }
}
