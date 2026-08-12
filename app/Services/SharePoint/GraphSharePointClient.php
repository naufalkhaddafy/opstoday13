<?php

namespace App\Services\SharePoint;

use App\Repositories\Contracts\SharePointClientInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GraphSharePointClient implements SharePointClientInterface
{
    /**
     * @return list<array<string, mixed>>
     */
    public function fetchListItems(string $siteId, string $listId): array
    {
        if (empty($siteId) || empty($listId)) {
            Log::warning('GraphSharePointClient: siteId or listId is empty.');
            return [];
        }

        $token = $this->getAccessToken();

        if (empty($token)) {
            Log::error('GraphSharePointClient: Failed to acquire Graph API access token.');
            return [];
        }

        $url = "https://graph.microsoft.com/v1.0/sites/{$siteId}/lists/{$listId}/items?\$expand=fields";
        $items = [];

        while ($url) {
            $response = Http::withToken($token)
                ->acceptJson()
                ->timeout(20)
                ->get($url);

            if (! $response->successful()) {
                Log::error('GraphSharePointClient: Failed fetching list items.', [
                    'url' => $url,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                break;
            }

            $json = $response->json();
            $rows = $json['value'] ?? [];

            foreach ($rows as $row) {
                if (! is_array($row)) {
                    continue;
                }

                $items[] = [
                    'id' => (string) ($row['id'] ?? ''),
                    'fields' => $row['fields'] ?? [],
                    'createdDateTime' => $row['createdDateTime'] ?? null,
                    'lastModifiedDateTime' => $row['lastModifiedDateTime'] ?? null,
                ];
            }

            $url = $json['@odata.nextLink'] ?? null;
        }

        return $items;
    }

    /**
     * Get OAuth2 access token for Microsoft Graph API using Azure Client Credentials.
     */
    protected function getAccessToken(): ?string
    {
        return Cache::remember('azure_graph_access_token', 3300, function () {
            $clientId = config('services.azure.client_id');
            $clientSecret = config('services.azure.client_secret');
            $tenantId = config('services.azure.tenant');

            if (empty($clientId) || empty($clientSecret) || empty($tenantId)) {
                Log::warning('GraphSharePointClient: Azure AD credentials missing in config.');
                return null;
            }

            $url = "https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token";

            $response = Http::asForm()->timeout(15)->post($url, [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'scope' => 'https://graph.microsoft.com/.default',
                'grant_type' => 'client_credentials',
            ]);

            if (! $response->successful()) {
                Log::error('GraphSharePointClient: Token acquisition failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            return $response->json('access_token');
        });
    }
}
