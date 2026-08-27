<?php

namespace App\Console\Commands;

use App\Models\ScheduleLog;
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
        $startTime = microtime(true);
        $startedAt = now();
        $this->info('Starting SharePoint data synchronization...');

        $log = ScheduleLog::create([
            'command' => 'opstoday:sync-sharepoint',
            'status' => 'running',
            'started_at' => $startedAt,
        ]);

        $type = $this->option('type');

        try {
            if ($type === 'all' || $type === 'initiatives') {
                $siteId = config('services.sharepoint.initiatives.site_id');
                $listId = config('services.sharepoint.initiatives.list_id');

                if (empty($siteId) || empty($listId)) {
                    $msg = '⚠️  SHAREPOINT_INITIATIVE_SITE_ID atau SHAREPOINT_INITIATIVE_LIST_ID belum diisi di file .env!';
                    $this->warn($msg);
                    $log->update([
                        'status' => 'failed',
                        'finished_at' => now(),
                        'duration' => round((microtime(true) - $startTime) * 1000),
                        'output' => $msg,
                    ]);
                    return self::FAILURE;
                }

                if (empty(config('services.azure.client_id')) || empty(config('services.azure.client_secret')) || empty(config('services.azure.tenant'))) {
                    $msg = '⚠️  AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, atau AZURE_TENANT_ID belum lengkap di file .env!';
                    $this->warn($msg);
                    $log->update([
                        'status' => 'failed',
                        'finished_at' => now(),
                        'duration' => round((microtime(true) - $startTime) * 1000),
                        'output' => $msg,
                    ]);
                    return self::FAILURE;
                }

                $stats = $syncService->syncInitiatives();
                
                $outputMsg = sprintf(
                    'SharePoint synchronization completed successfully! Fetched: %d, Inserted: %d, Updated: %d, Deleted: %d',
                    $stats['fetched'],
                    $stats['inserted'],
                    $stats['updated'],
                    $stats['deleted']
                );
                
                $this->info($outputMsg);

                $log->update([
                    'status' => 'success',
                    'finished_at' => now(),
                    'duration' => round((microtime(true) - $startTime) * 1000),
                    'output' => $outputMsg,
                    'metadata' => $stats,
                ]);
            }

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'finished_at' => now(),
                'duration' => round((microtime(true) - $startTime) * 1000),
                'output' => "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString(),
            ]);
            
            $this->error($e->getMessage());
            return self::FAILURE;
        }
    }
}
