<?php

namespace App\Services\Sihepi;

use App\Enums\TicketStatus;
use App\Repositories\Contracts\SihepiTicketClientInterface;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HttpSihepiTicketClient implements SihepiTicketClientInterface
{
    /**
     * @return list<array<string, mixed>>
     */
    public function fetchOpenFor(string $employeeId): array
    {
        $baseUrl = $this->baseUrl();

        if ($baseUrl === null) {
            return [];
        }

        $rows = $this->getList(rtrim($baseUrl, '/').'/GetAllTicketById/'.urlencode($employeeId));

        $records = [];

        foreach ($rows as $row) {
            $status = TicketStatus::tryFromApi($row['status'] ?? null);

            if ($status === null) {
                continue;
            }

            $records[] = [
                'ticket_no' => (string) ($row['ticketNo'] ?? ''),
                'category' => $this->clean($row['category'] ?? null),
                'sub_category' => $this->clean($row['subCategory'] ?? null),
                'title' => $this->clean($row['title'] ?? null),
                'computer_name' => $this->clean($row['computerName'] ?? null),
                'requested_for' => $this->clean($row['requestedFor'] ?? null),
                'requested_by' => $this->clean($row['requestedBy'] ?? null),
                'status' => $status,
                'assigned_to_name' => $this->clean($row['assignedTo'] ?? null),
                // assignedToID is null in the open API, so use the polled technician id.
                'assigned_to_id' => $employeeId,
                'work_group' => $this->clean($row['workGroup'] ?? null),
            ];
        }

        return $records;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function fetchCompleted(): array
    {
        $baseUrl = $this->baseUrl();

        if ($baseUrl === null) {
            return [];
        }

        $rows = $this->getList(rtrim($baseUrl, '/').'/GetAllTicketCompleted');

        $records = [];

        foreach ($rows as $row) {
            $status = TicketStatus::tryFromApi($row['status'] ?? null) ?? TicketStatus::Closed;

            $records[] = [
                'ticket_no' => (string) ($row['ticketNo'] ?? ''),
                'category' => $this->clean($row['category'] ?? null),
                'sub_category' => $this->clean($row['subCategory'] ?? null),
                'title' => $this->clean($row['title'] ?? null),
                'computer_name' => $this->clean($row['computerName'] ?? null),
                'requested_for' => $this->clean($row['requestedFor'] ?? null),
                'requested_by' => $this->clean($row['requestedBy'] ?? null),
                'status' => $status,
                'assigned_to_name' => $this->clean($row['assignedTo'] ?? null),
                'assigned_to_id' => $this->clean($row['assignedToID'] ?? null),
                'work_group' => $this->clean($row['workGroup'] ?? null),
                'api_creation_date' => $this->parseDate($row['creationDate'] ?? null),
                'completed_date' => $this->parseDate($row['completedDate'] ?? null),
                'resolution_time' => $this->clean($row['resolutionTime'] ?? null),
            ];
        }

        return $records;
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function getList(string $url): array
    {
        $response = $this->request()->get($url);

        if (! $response->successful()) {
            Log::warning('Sihepi ticket API fetch failed', [
                'url' => $url,
                'status' => $response->status(),
            ]);

            $response->throw();
        }

        $rows = $response->json('listTicket', []);

        return is_array($rows) ? array_values($rows) : [];
    }

    protected function request(): PendingRequest
    {
        $request = Http::acceptJson()
            ->timeout((int) config('services.sihepi.timeout', 15))
            ->retry(1, 200);

        if (! config('services.sihepi.verify_ssl', false)) {
            $request = $request->withoutVerifying();
        }

        return $request;
    }

    protected function baseUrl(): ?string
    {
        $baseUrl = config('services.sihepi.base_url');

        return empty($baseUrl) ? null : (string) $baseUrl;
    }

    protected function clean(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim(str_replace(["\r", "\n"], ' ', $value));
        $value = trim(preg_replace('/\s+/', ' ', $value) ?? $value);

        return $value === '' ? null : $value;
    }

    protected function parseDate(?string $value): ?CarbonImmutable
    {
        $value = $this->clean($value);

        if ($value === null) {
            return null;
        }

        try {
            return CarbonImmutable::parse($value, config('app.timezone'));
        } catch (\Throwable) {
            return null;
        }
    }
}
