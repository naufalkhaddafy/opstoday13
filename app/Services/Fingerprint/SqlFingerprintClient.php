<?php

namespace App\Services\Fingerprint;

use App\Repositories\Contracts\FingerprintClientInterface;
use App\Enums\AttendanceLogStatus;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SqlFingerprintClient implements FingerprintClientInterface
{
    /**
     * @return list<array{employee_id: string, status: string, punched_at: CarbonImmutable}>
     */
    public function fetch(): array
    {
        // 1. Ambil semua employee_id dari user yang aktif
        $employeeIds = User::query()
            ->where('is_active', true)
            ->whereNotNull('employee_id')
            ->pluck('employee_id')
            ->toArray();

        if (empty($employeeIds)) {
            return [];
        }

        try {
            // 2. Query ke SQL Server (smartweb_b/up)
            $rows = DB::connection('fingerprint_sqlsrv')
                ->table('vwAbsensiIT')
                ->whereIn('fsCardNo', $employeeIds)
                ->orderBy('fsName')
                ->get();

        } catch (\Exception $e) {
            Log::error('SQL Fingerprint fetch failed', [
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }

        $records = [];
        $timezone = config('app.timezone');

        foreach ($rows as $row) {
            $rowArray = (array) $row;
            
            $status = AttendanceLogStatus::tryFromApi($rowArray['status1'] ?? null);

            if ($status === null || $status === AttendanceLogStatus::Absen) {
                continue;
            }

            if (empty($rowArray['CI'])) {
                continue;
            }

            $cleanDate = substr(str_replace('T', ' ', $rowArray['CI']), 0, 19);
            $punchedAt = CarbonImmutable::parse($cleanDate, $timezone);

            $records[] = [
                'employee_id' => $this->normalizeEmployeeId((string) $rowArray['fsCardNo']),
                'status' => $status->value,
                'punched_at' => $punchedAt,
            ];
        }

        return $records;
    }

    private function normalizeEmployeeId(string $raw): string
    {
        $value = ltrim($raw, '0');

        if ($value === '') {
            return '0';
        }

        if ($value[0] === '8') {
            $value = 'Z' . substr($value, 1);
        }

        return $value;
    }
}
