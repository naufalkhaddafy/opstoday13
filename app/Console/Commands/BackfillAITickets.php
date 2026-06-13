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
    protected $signature = 'ops:backfill-ai-tickets {--limit=0 : Batasi jumlah tiket yang diproses (0 = semua)} {--force : Hapus prediksi sebelumnya dan ulangi dari awal}';

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
        
        if ($force) {
            $this->info("Menghapus semua prediksi AI sebelumnya...");
            \App\Models\TicketAIPrediction::truncate();
        }

        $query = Ticket::query()
            ->whereNotNull('title')
            ->whereDoesntHave('aiPrediction');
        
        if ($limit > 0) {
            $query->limit($limit);
        }

        $total = $query->count();
        
        if ($total === 0) {
            $this->info("Semua tiket sudah memiliki Kategori AI. Tidak ada yang perlu diproses.");
            return 0;
        }

        $this->info("Ditemukan {$total} tiket lama. Memulai proses prediksi massal ke AI Engine...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        // Proses bertahap (chunk) agar memori server tidak penuh
        $query->chunkById(100, function ($tickets) use ($aiEngine, $bar) {
            foreach ($tickets as $ticket) {
                $aiResult = $aiEngine->analyzeTicket($ticket->title, '');
                
                if ($aiResult) {
                    $ticket->aiPrediction()->updateOrCreate(
                        ['ticket_id' => $ticket->id],
                        [
                            'cluster_id' => $aiResult['cluster_id'] ?? null,
                            'cluster_label' => $aiResult['cluster_label'] ?? null,
                        ]
                    );
                }
                
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);
        $this->info("Selesai! AI berhasil memprediksi {$total} tiket lama.");
        return 0;
    }
}
