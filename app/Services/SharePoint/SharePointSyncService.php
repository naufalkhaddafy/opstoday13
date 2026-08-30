<?php

namespace App\Services\SharePoint;

use App\Models\SharePointData;
use App\Models\SharePointInitiative;
use App\Models\User;
use App\Repositories\Contracts\SharePointClientInterface;
use Carbon\Carbon;
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

        $allUsers = User::all();

        $getValue = function (array $arr, array $keys) {
            foreach ($keys as $k) {
                if (isset($arr[$k])) return $arr[$k];
            }
            return null;
        };

        // Helper function for fuzzy matching names
        $namesMatch = function ($strA, $strB): bool {
            $normalize = fn ($s) => strtolower(trim(preg_replace('/[^a-z0-9]/i', ' ', $s)));
            $normA = preg_replace('/\s+/', ' ', $normalize($strA));
            $normB = preg_replace('/\s+/', ' ', $normalize($strB));

            if ($normA === '' || $normB === '') {
                return false;
            }

            $wordsA = array_filter(explode(' ', $normA), fn ($w) => strlen($w) >= 3 && !in_array($w, ['dso', 'dco', 'kpc', 'ext', 'it', 'the', 'and', 'for']));
            $wordsB = array_filter(explode(' ', $normB), fn ($w) => strlen($w) >= 3 && !in_array($w, ['dso', 'dco', 'kpc', 'ext', 'it', 'the', 'and', 'for']));

            if (count($wordsA) > 0 && count($wordsB) > 0) {
                $common = array_intersect($wordsA, $wordsB);
                if (count($common) >= 2 || (count($wordsA) === 1 && count($common) === 1) || (count($wordsB) === 1 && count($common) === 1)) {
                    return true;
                }
            } elseif ($normA === $normB) {
                return true;
            }

            return false;
        };

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

            // ETL: Extract specific data into sharepoint_initiatives
            $title = $fields['Title'] ?? null;
            $status = $fields['Status'] ?? $fields['InitiativeStatus'] ?? $getValue($fields, ['ApprovalStatus', 'Approval Status']);
            $impactLevel = $fields['ImpactLevel'] ?? $fields['Impact Level'] ?? $fields['Impact'] ?? $getValue($fields, ['Priority', 'StrategicImpact']);
            $targetTimeline = $fields['TargetTimeline'] ?? $fields['Target Timeline'] ?? $getValue($fields, ['Timeline', 'DueDate', 'Due Date']);
            
            // Extract submission date
            $submissionDateStr = $fields['SubmissionDate'] ?? $fields['Date'] ?? $getValue($fields, ['Created', 'Modified']);
            $submissionDate = null;
            if ($submissionDateStr) {
                try {
                    $submissionDate = Carbon::parse($submissionDateStr)->toDateString();
                } catch (\Exception $e) {
                    $submissionDate = null;
                }
            }

            $spInitiative = SharePointInitiative::updateOrCreate(
                ['sharepoint_item_id' => $itemId],
                [
                    'title' => is_array($title) ? json_encode($title) : $title,
                    'status' => is_array($status) ? json_encode($status) : $status,
                    'impact_level' => is_array($impactLevel) ? json_encode($impactLevel) : $impactLevel,
                    'target_timeline' => is_array($targetTimeline) ? json_encode($targetTimeline) : $targetTimeline,
                    'submission_date' => $submissionDate,
                    'raw_data' => $fields,
                ]
            );

            // Match users for the pivot table
            $matchedUserIds = [];
            foreach ($allUsers as $engineer) {
                $empId = $engineer->employee_id ? strtolower(trim($engineer->employee_id)) : null;
                $email = $engineer->email ? strtolower(trim($engineer->email)) : null;

                $checkValue = function ($value) use ($engineer, $empId, $email, $namesMatch, &$checkValue): bool {
                    if ($value === null) {
                        return false;
                    }
                    if (is_string($value) && trim($value) !== '') {
                        $v = strtolower(trim($value));
                        if ($namesMatch($engineer->name, $value)) {
                            return true;
                        }
                        if ($empId && str_contains($v, $empId)) {
                            return true;
                        }
                        if ($email && (str_contains($v, $email) || $namesMatch($email, $value))) {
                            return true;
                        }
                        return false;
                    }
                    if (is_array($value)) {
                        foreach ($value as $val) {
                            if ($checkValue($val)) {
                                return true;
                            }
                        }
                    }
                    if (is_object($value)) {
                        $objName = $value->LookupValue ?? $value->Email ?? $value->Title ?? $value->Name ?? $value->label ?? null;
                        if ($objName && $checkValue($objName)) {
                            return true;
                        }
                    }
                    return false;
                };

                $isMatch = false;
                $personKeys = ['SubmittedBy', 'Submitted By'];
                foreach ($personKeys as $key) {
                    if (isset($fields[$key]) && $checkValue($fields[$key])) {
                        $isMatch = true;
                        break;
                    }
                }

                if ($isMatch) {
                    $matchedUserIds[] = $engineer->id;
                }
            }

            // Sync users in pivot table
            $spInitiative->users()->sync($matchedUserIds);
        }

        // Bulk Insert new generic records
        $insertedCount = count($itemsToInsert);
        if ($insertedCount > 0) {
            foreach (array_chunk($itemsToInsert, 500) as $chunk) {
                SharePointData::insert($chunk);
            }
        }

        // Bulk Delete removed records
        $deletedCount = 0;
        if (count($fetchedItemIds) > 0) {
            SharePointData::where('site_id', $siteId)
                ->where('list_id', $listId)
                ->whereNotIn('sharepoint_item_id', $fetchedItemIds)
                ->delete();
                
            SharePointInitiative::whereNotIn('sharepoint_item_id', $fetchedItemIds)->delete();
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
