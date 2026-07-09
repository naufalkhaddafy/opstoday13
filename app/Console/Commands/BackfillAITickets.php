<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\Analytics\AIEngineService;
use Illuminate\Console\Command;

class BackfillAITickets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ops:backfill-ai-tickets {--limit=0 : Batasi jumlah tiket yang diproses (0 = semua)} {--force : Hapus prediksi sebelumnya dan ulangi dari awal} {--days= : Batasi tiket berdasarkan jumlah hari ke belakang (opsional, default dari setting database)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Melakukan prediksi kategori AI untuk tiket-tiket lama yang belum memiliki kategori AI';

    /**
     * Execute the console command.
     */
    public function handle(AIEngineService $aiEngine)
    {
        $limit = (int) $this->option('limit');
        $force = $this->option('force');
        $daysOpt = $this->option('days');
        $days = $daysOpt !== null ? (int) $daysOpt : (int) app(\App\Repositories\Contracts\SettingRepositoryInterface::class)->get('ai_backfill_days', 30);
        
        $query = Ticket::query()->whereNotNull('title');

        if ($days > 0) {
            $dateLimit = now()->subDays($days)->format('Y-m-d H:i:s');
            $query->whereRaw("COALESCE(api_creation_date, first_seen_at, status_changed_at) >= ?", [$dateLimit]);
        }
        
        if ($force) {
            $this->info("Menghapus prediksi AI sebelumnya" . ($days > 0 ? " (untuk {$days} hari terakhir)..." : "..."));
            $ticketIds = (clone $query)->pluck('id');
            \App\Models\TicketAIPrediction::whereIn('ticket_id', $ticketIds)->delete();
        } else {
            $query->whereDoesntHave('aiPrediction');
        }
        
        if ($limit > 0) {
            $query->limit($limit);
        }

        $total = $query->count();
        
        if ($total === 0) {
            $msg = $days > 0 
                ? "Tidak ada tiket yang ditemukan dalam {$days} hari terakhir." 
                : "Semua tiket sudah memiliki Kategori AI. Tidak ada yang perlu diproses.";
            
            $this->info($msg);
            \Illuminate\Support\Facades\Cache::put('cmd_progress:ops_backfill', [
                'status' => 'completed',
                'progress' => 100,
                'message' => 'Selesai! ' . $msg,
            ], 120);
            return 0;
        }

        $this->info("Ditemukan {$total} tiket lama. Memulai proses prediksi massal ke AI Engine...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        \Illuminate\Support\Facades\Cache::put('cmd_progress:ops_backfill', [
            'status' => 'running',
            'progress' => 0,
            'message' => "[Filter: {$days} Hari] Memulai proses prediksi untuk {$total} tiket...",
        ], 600);

        $processed = 0;

        // Proses bertahap (chunk) agar memori server tidak penuh
        $query->chunkById(100, function ($tickets) use ($aiEngine, $bar, &$processed, $total) {
            foreach ($tickets as $ticket) {
                $data = $aiEngine->analyzeTicket($ticket->title, '');
                
                if ($data) {
                    $ticket->aiPrediction()->updateOrCreate(
                        ['ticket_id' => $ticket->id],
                        [
                            'cluster_id' => $data['cluster_id'] ?? 0,
                            'cluster_label' => $data['cluster_label'] ?? 'Uncategorized',
                            'sub_cluster_label' => $data['sub_cluster_label'] ?? null,
                            'suggested_solution' => $data['suggested_solution'] ?? null,
                        ]
                    );
                }
                
                $processed++;
                $bar->advance();

                // Update cache every 10 tickets to avoid too many Redis calls
                if ($processed % 10 === 0 || $processed === $total) {
                    $percent = (int) round(($processed / $total) * 100);
                    \Illuminate\Support\Facades\Cache::put('cmd_progress:ops_backfill', [
                        'status' => 'running',
                        'progress' => $percent,
                        'message' => "Memproses tiket {$processed} / {$total}...",
                    ], 600);
                }
            }
        });

        $bar->finish();
        $this->newLine(2);
        $this->info("Selesai! AI berhasil memprediksi {$total} tiket lama.");

        \Illuminate\Support\Facades\Cache::put('cmd_progress:ops_backfill', [
            'status' => 'completed',
            'progress' => 100,
            'message' => "Selesai! AI berhasil memprediksi {$total} tiket lama.",
        ], 120);

        return 0;
    }
}
