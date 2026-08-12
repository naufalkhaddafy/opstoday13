<?php

namespace App\Console\Commands;

use App\Services\SharePoint\SharePointSyncService;
use Illuminate\Console\Command;

class SyncSharePointCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'opstoday:sync-sharepoint {--type=all : Type of SharePoint list to sync (e.g., initiatives, all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize SharePoint List items into the schema-agnostic sharepoint_data table';

    /**
     * Execute the console command.
     */
    public function handle(SharePointSyncService $syncService): int
    {
        $type = $this->option('type');

        if ($type === 'all' || $type === 'initiatives') {
            $siteId = config('services.sharepoint.initiatives.site_id');
            $listId = config('services.sharepoint.initiatives.list_id');

            if (empty($siteId) || empty($listId)) {
                $this->warn('⚠️  SHAREPOINT_INITIATIVE_SITE_ID atau SHAREPOINT_INITIATIVE_LIST_ID belum diisi di file .env!');
                $this->line('   Silakan isi nilai site_id dan list_id terlebih dahulu agar dapat menyinkronkan data.');
                return self::FAILURE;
            }

            if (empty(config('services.azure.client_id')) || empty(config('services.azure.client_secret')) || empty(config('services.azure.tenant'))) {
                $this->warn('⚠️  AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, atau AZURE_TENANT_ID belum lengkap di file .env!');
                $this->line('   Silakan lengkapi kredensial otentikasi Azure AD di .env.');
                return self::FAILURE;
            }

            $this->info('Starting SharePoint data synchronization...');
            $count = $syncService->syncInitiatives();
            $this->info("Successfully synchronized {$count} initiatives from SharePoint.");
        }

        $this->info('SharePoint synchronization completed successfully!');

        return self::SUCCESS;
    }
}
