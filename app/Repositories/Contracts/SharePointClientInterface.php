<?php

namespace App\Repositories\Contracts;

interface SharePointClientInterface
{
    /**
     * Fetch list items from a specific SharePoint site and list.
     *
     * @param string $siteId The SharePoint site ID (e.g., domain.sharepoint.com,uuid,uuid)
     * @param string $listId The SharePoint list ID (UUID)
     * @return list<array<string, mixed>>
     */
    public function fetchListItems(string $siteId, string $listId): array;
}
