<?php

namespace App\Services\Analytics;

class TicketTrendAnalyzer
{
    /**
     * Stop words yang umum diabaikan dalam judul tiket
     */
    protected array $stopWords = [
        // English
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it',
        'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these',
        'they', 'this', 'to', 'was', 'will', 'with', 'issue', 'error', 'problem', 'need', 'help',
        'please', 'pls', 'fix', 'update', 'check', 'request', 'failed', 'fail', 'always', 'cannot', 'can', 'unable',

        // Indonesian
        'di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'yang', 'dengan', 'ini', 'itu', 'pada', 'jika',
        'karena', 'bisa', 'ada', 'tidak', 'belum', 'sudah', 'akan', 'tolong', 'bantu', 'bantuan',
        'mohon', 'tanya', 'masalah', 'kendala', 'eror', 'gagal', 'cek', 'perlu', 'minta', 'buat', 'terus',
        'mau', 'muncul', 'kenapa', 'gimana', 'cara', 'apa', 'lagi', 'masih', 'udah', 'gak', 'ga', 'nggak',
        'pas', 'saat', 'waktu', 'ketika', 'setelah', 'bikin', 'kasih', 'buka', 'tutup', 'nya', 'kok', 'sih',
        'rusak', 'mati', 'lambat', 'lemot', 'lelet', 'cepat', 'baru', 'lama', 'tdk', 'blm', 'sdh', 'dgn',
        'ganti', 'tambah', 'hapus', 'kurang', 'baik', 'benar', 'salah', 'ingin', 'harus', 'coba', 'lupa', 'akses', 'login', 'notif',
        'masukan','kode','nomor'
    ];

    /**
     * @param string[] $currentTitles Array of ticket titles in the current period
     * @param string[] $previousTitles Array of ticket titles in the previous period
     * @param int $limit How many top phrases to return
     * @return array
     */
    public function analyze(array $currentTitles, array $previousTitles, int $limit = 5): array
    {
        $currentPhrases = $this->extractPhrases($currentTitles);
        $previousPhrases = $this->extractPhrases($previousTitles);

        // Sort current phrases by count descending
        arsort($currentPhrases);

        $trends = [];
        $count = 0;

        foreach ($currentPhrases as $phrase => $currentCount) {
            if ($count >= $limit) {
                break;
            }

            // Skip single words if they're too generic, although stop words handle most of it.
            // But we keep it simple for now.

            $previousCount = $previousPhrases[$phrase] ?? 0;
            
            $percentageChange = 0;
            $trend = 'new'; // 'up', 'down', 'stable', 'new'

            if ($previousCount > 0) {
                $percentageChange = (($currentCount - $previousCount) / $previousCount) * 100;
                if ($percentageChange > 0) {
                    $trend = 'up';
                } elseif ($percentageChange < 0) {
                    $trend = 'down';
                } else {
                    $trend = 'stable';
                }
            } else {
                // If it was 0 before, it's a 100% increase mathematically, but functionally it's "new" or "+100%"
                $percentageChange = 100; 
            }

            $trends[] = [
                'phrase' => ucwords($phrase),
                'count' => $currentCount,
                'previous_count' => $previousCount,
                'trend' => $trend,
                'percentage' => round(abs($percentageChange))
            ];

            $count++;
        }

        return $trends;
    }

    /**
     * Parse raw titles into keywords (Legacy)
     */
    protected function extractPhrases(array $titles): array
    {
        $phrases = [];
        foreach ($titles as $title) {
            $words = $this->cleanAndTokenize($title);
            if (empty($words)) continue;

            $phrase = implode(' ', array_slice($words, 0, 2));
            if (!isset($phrases[$phrase])) {
                $phrases[$phrase] = 0;
            }
            $phrases[$phrase]++;
        }
        return $phrases;
    }

    /**
     * Analyze trends from pre-extracted AI keywords
     *
     * @param string[] $currentKeywords
     * @param string[] $previousKeywords
     * @param int $limit
     * @return array
     */
    public function analyzeKeywords(array $currentKeywords, array $previousKeywords, ?int $limit = 5): array
    {
        $currentCounts = array_count_values(array_filter(array_map('trim', $currentKeywords)));
        $previousCounts = array_count_values(array_filter(array_map('trim', $previousKeywords)));

        arsort($currentCounts);

        $trends = [];
        $count = 0;

        foreach ($currentCounts as $keyword => $currentCount) {
            if ($limit !== null && $count >= $limit) {
                break;
            }

            $previousCount = $previousCounts[$keyword] ?? 0;
            
            $percentageChange = 0;
            $trend = 'new'; // 'up', 'down', 'stable', 'new'

            if ($previousCount > 0) {
                $percentageChange = (($currentCount - $previousCount) / $previousCount) * 100;
                if ($percentageChange > 0) {
                    $trend = 'up';
                } elseif ($percentageChange < 0) {
                    $trend = 'down';
                } else {
                    $trend = 'stable';
                }
            }

            $trends[] = [
                'phrase' => $keyword,
                'count' => $currentCount,
                'trend' => $trend,
                'percentage' => abs(round($percentageChange, 1))
            ];

            $count++;
        }

        return $trends;
    }

    protected function cleanAndTokenize(string $text): array
    {
        // Convert to lowercase
        $text = strtolower($text);

        // Remove punctuation and special characters
        $text = preg_replace('/[^\w\s-]/', ' ', $text);

        // Split into words
        $words = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);

        if (!$words) return [];

        // Remove stop words and short words
        $filteredWords = array_filter($words, function ($word) {
            return strlen($word) > 2 && !in_array($word, $this->stopWords);
        });

        // Re-index array
        return array_values($filteredWords);
    }

    private function incrementPhrase(array &$frequencies, string $phrase): void
    {
        // Don't count phrases that are just numbers
        if (is_numeric(str_replace(' ', '', $phrase))) {
            return;
        }

        if (!isset($frequencies[$phrase])) {
            $frequencies[$phrase] = 0;
        }
        $frequencies[$phrase]++;
    }
}
