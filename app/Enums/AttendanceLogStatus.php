<?php

namespace App\Enums;

enum AttendanceLogStatus: string
{
    case Hadir = 'hadir';
    case Keluar = 'keluar';
    case Absen = 'absen';

    public static function tryFromApi(?string $value): ?self
    {
        if ($value === null || $value === '') {
            return null;
        }

        return self::tryFrom(strtolower(trim($value)));
    }
}
