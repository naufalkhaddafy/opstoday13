<?php

namespace App\Enums;

enum AttendanceSyncRunStatus: string
{
    case Running = 'running';
    case Success = 'success';
    case Failed = 'failed';
}
