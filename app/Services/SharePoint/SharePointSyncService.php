<?php

namespace App\Services\SharePoint;

use App\Models\SharePointData;
use App\Repositories\Contracts\SharePointClientInterface;
use Illuminate\Support\Facades\Log;

class SharePointSyncService
{
    public function __construct(
        protected SharePointClientInterface $client
    ) {}

    /**
     * Synchronize the initiatives list into sharepoint_data table.
     *
     * @return int Number of items synchronized
     */
    public function syncInitiatives(): int
    {
        $siteId = (string) config('services.sharepoint.initiatives.site_id');
        $listId = (string) config('services.sharepoint.initiatives.list_id');

        if (empty($siteId) || empty($listId)) {
            Log::warning('SharePointSyncService: SharePoint initiatives site_id or list_id is not configured.');
            return 0;
        }

        $items = $this->client->fetchListItems($siteId, $listId);
        $count = 0;

        foreach ($items as $item) {
            $itemId = (string) ($item['id'] ?? '');
            if ($itemId === '') {
                continue;
            }

            $fields = $item['fields'] ?? [];
            if (! is_array($fields)) {
                continue;
            }

            SharePointData::updateOrCreate(
                [
                    'site_id' => $siteId,
                    'list_id' => $listId,
                    'sharepoint_item_id' => $itemId,
                ],
                [
                    'type' => 'initiative',
                    'data' => $fields,
                    'last_synced_at' => now(),
                ]
            );

            $count++;
        }

        Log::info('SharePointSyncService: Synchronized initiatives.', [
            'count' => $count,
            'site_id' => $siteId,
            'list_id' => $listId,
        ]);

        return $count;
    }
}
