<?php

namespace App\Enums;

enum TicketSyncRunKind: string
{
    case Open = 'open';
    case Completed = 'completed';
}
