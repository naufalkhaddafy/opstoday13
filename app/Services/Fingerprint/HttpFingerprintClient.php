<?php

namespace App\Services\Fingerprint;

use App\Repositories\Contracts\FingerprintClientInterface;
use App\Enums\AttendanceLogStatus;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HttpFingerprintClient implements FingerprintClientInterface
{
    /**
     * @return list<array{employee_id: string, status: string, punched_at: CarbonImmutable}>
     */
    public function fetch(): array
    {
        $url = config('services.fingerprint.url');

        if (empty($url)) {
            return [];
        }

        $response = Http::acceptJson()
            ->get($url);

        if (! $response->successful()) {
            Log::warning('Fingerprint API fetch failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            $response->throw();
        }

        $records = [];
        $timezone = config('app.timezone');

        foreach ($response->json('data', $response->json()) ?? [] as $row) {
            $status = AttendanceLogStatus::tryFromApi($row['status1'] ?? null);

            if ($status === null || $status === AttendanceLogStatus::Absen) {
                continue;
            }

            $cleanDate = substr(str_replace('T', ' ', $row['fdDate']), 0, 19);
            $punchedAt = CarbonImmutable::parse($cleanDate, $timezone);

            // The API is state-based, so we consume everything it gives us.
            // (Removed the $from / $to filtering here so any incoming data is processed)
            $records[] = [
                'employee_id' => (string) $row['fsIdNo'],
                'status' => $status->value,
                'punched_at' => $punchedAt,
            ];
        }

        return $records;
    }
}
