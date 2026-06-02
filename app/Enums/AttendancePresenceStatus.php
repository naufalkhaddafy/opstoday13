<?php

namespace App\Enums;

enum AttendancePresenceStatus: string
{
    case Hadir = 'hadir';
    case TidakLengkap = 'tidak_lengkap';
    case Absen = 'absen';
    case TidakHadir = 'tidak_hadir';
    case Cuti = 'cuti';
    case Sakit = 'sakit';
    case Izin = 'izin';
}
