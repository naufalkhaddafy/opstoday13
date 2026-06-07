<?php

namespace App\Enums;

enum TicketSyncRunStatus: string
{
    case Running = 'running';
    case Success = 'success';
    case Failed = 'failed';
}
