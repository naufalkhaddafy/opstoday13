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
     * @return array Sync statistics
     */
    public function syncInitiatives(): array
    {
        $siteId = (string) config('services.sharepoint.initiatives.site_id');
        $listId = (string) config('services.sharepoint.initiatives.list_id');

        if (empty($siteId) || empty($listId)) {
            Log::warning('SharePointSyncService: SharePoint initiatives site_id or list_id is not configured.');
            return ['fetched' => 0, 'inserted' => 0, 'updated' => 0, 'deleted' => 0];
        }

        $items = $this->client->fetchListItems($siteId, $listId);
        
        // 1. Fetch all existing records from DB to memory (O(1) query)
        $existingRecords = SharePointData::where('site_id', $siteId)
            ->where('list_id', $listId)
            ->get()
            ->keyBy('sharepoint_item_id');

        $fetchedItemIds = [];
        $itemsToInsert = [];
        $updatedCount = 0;
        $now = now();

        foreach ($items as $item) {
            $itemId = (string) ($item['id'] ?? '');
            if ($itemId === '') {
                continue;
            }

            $fields = $item['fields'] ?? [];
            if (! is_array($fields)) {
                continue;
            }

            $fetchedItemIds[] = $itemId;
            $existing = $existingRecords->get($itemId);

            if (! $existing) {
                // New record
                $itemsToInsert[] = [
                    'site_id' => $siteId,
                    'list_id' => $listId,
                    'sharepoint_item_id' => $itemId,
                    'type' => 'initiative',
                    'data' => json_encode($fields),
                    'last_synced_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            } else {
                // Existing record, check if data changed
                $oldData = json_encode($existing->data);
                $newData = json_encode($fields);

                if ($oldData !== $newData) {
                    $existing->data = $fields;
                    $existing->last_synced_at = $now;
                    $existing->save();
                    $updatedCount++;
                }
            }
        }

        // Bulk Insert new records
        $insertedCount = count($itemsToInsert);
        if ($insertedCount > 0) {
            foreach (array_chunk($itemsToInsert, 500) as $chunk) {
                SharePointData::insert($chunk);
            }
        }

        // Bulk Delete removed records
        $deletedCount = 0;
        if (count($fetchedItemIds) > 0) {
            $deletedCount = SharePointData::where('site_id', $siteId)
                ->where('list_id', $listId)
                ->whereNotIn('sharepoint_item_id', $fetchedItemIds)
                ->delete();
        }

        $totalFetched = count($fetchedItemIds);

        $stats = [
            'fetched' => $totalFetched,
            'inserted' => $insertedCount,
            'updated' => $updatedCount,
            'deleted' => $deletedCount,
        ];

        Log::info('SharePointSyncService: Synchronized initiatives.', [
            'stats' => $stats,
            'site_id' => $siteId,
            'list_id' => $listId,
        ]);

        return $stats;
    }
}
