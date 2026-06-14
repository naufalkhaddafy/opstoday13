<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\ScheduleLog;
use App\Services\Whatsapp\OpsSnapshotBuilder;
use App\Services\Whatsapp\WahaClient;
use Illuminate\Console\Command;

class SendOpsSnapshotCommand extends Command
{
    protected $signature = 'ops:send-snapshot {type : morning|evening}';

    protected $description = 'Send operational snapshot to WhatsApp groups via WAHA API';

    public function handle(OpsSnapshotBuilder $builder, WahaClient $waha): int
    {
        $type = $this->argument('type');

        if (!in_array($type, ['morning', 'evening'])) {
            $this->error("Invalid type: {$type}. Use 'morning' or 'evening'.");
            return self::FAILURE;
        }

        $startTime = microtime(true);
        $this->info("Starting {$type} ops snapshot...");

        $log = ScheduleLog::create([
            'command' => "ops:send-snapshot {$type}",
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            // Ambil SEMUA company agar bisa di-log mana yang di-skip
            $companies = Company::all();

            if ($companies->isEmpty()) {
                $msg = 'No companies found in database.';
                $this->warn($msg);

                $log->update([
                    'status' => 'success',
                    'finished_at' => now(),
                    'duration' => round((microtime(true) - $startTime) * 1000),
                    'output' => $msg,
                ]);

                return self::SUCCESS;
            }

            $sent = 0;
            $failed = 0;
            $skipped = 0;
            $details = [];

            foreach ($companies as $company) {
                // Skip jika tidak ada nomor WA
                $groups = $company->whatsapp_groups ?? [];
                if (empty($groups)) {
                    $skipped++;
                    $details[] = "⏭️ {$company->name} (Skipped - No WhatsApp groups)";
                    $this->line("Skipping {$company->name} (No WhatsApp groups configured).");
                    continue;
                }

                $this->info("Building {$type} snapshot for {$company->name}...");

                $text = $type === 'morning'
                    ? $builder->buildMorning($company)
                    : $builder->buildEvening($company);

                foreach ($groups as $chatId) {
                    // Auto-detect format chatId:
                    if (!str_contains($chatId, '@')) {
                        $chatId = strlen($chatId) > 15
                            ? $chatId . '@g.us'
                            : $chatId . '@c.us';
                    }

                    $this->info("Sending to {$chatId}...");
                    $success = $waha->sendText($chatId, $text);

                    if ($success) {
                        $sent++;
                        $details[] = "✅ {$company->name} ({$chatId})";
                        $this->info("✅ Sent to {$company->name} ({$chatId})");
                    } else {
                        $failed++;
                        $details[] = "❌ {$company->name} ({$chatId})";
                        $this->error("❌ Failed for {$company->name} ({$chatId})");
                    }
                }
            }

            $outputMsg = sprintf(
                '%s snapshot complete. Companies: %d, Sent: %d, Failed: %d, Skipped: %d',
                ucfirst($type),
                $companies->count(),
                $sent,
                $failed,
                $skipped
            );

            $this->info($outputMsg);

            $log->update([
                'status' => $failed === 0 ? 'success' : 'partial',
                'finished_at' => now(),
                'duration' => round((microtime(true) - $startTime) * 1000),
                'output' => $outputMsg . "\n" . implode("\n", $details),
                'metadata' => [
                    'type' => $type,
                    'companies' => $companies->count(),
                    'sent' => $sent,
                    'failed' => $failed,
                    'skipped' => $skipped,
                ],
            ]);

            return $failed === 0 ? self::SUCCESS : self::FAILURE;
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
