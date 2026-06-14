<?php

namespace App\Helpers;

/**
 * Konstanta SLA untuk Ops Snapshot.
 * Ubah nilai di sini untuk menyesuaikan threshold SLA.
 */
final class SlaConstants
{
    // Response time threshold (menit) — hijau jika <= ini
    public const RESPONSE_TIME_GREEN = 60;

    // Resolution time threshold (menit) — hijau jika <= ini
    public const RESOLUTION_TIME_GREEN = 120;

    // Work duration target (jam) — untuk menentukan "Perfect" / "Extended"
    public const WORK_DURATION_HOURS = 8;

    // Aging ticket threshold (hari) — tiket dianggap aging jika > ini
    public const AGING_DAYS = 3;

    // High ticket load threshold — engineer dianggap high load jika >= ini dalam 24 jam
    public const HIGH_TICKET_LOAD = 10;
}
