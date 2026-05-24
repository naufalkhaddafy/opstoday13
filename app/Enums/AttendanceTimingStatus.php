<?php

namespace App\Enums;

enum AttendanceTimingStatus: string
{
    case OnTime = 'on_time';
    case Late = 'late';
    case EarlyLeave = 'early_leave';
    case Overtime = 'overtime';
    case Mixed = 'mixed';
}
