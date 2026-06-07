<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Assigned = 'assigned';
    case PendingOnHold = 'pending_on_hold';
    case InProgress = 'in_progress';
    case Closed = 'closed';

    public static function tryFromApi(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        $normalized = strtolower(trim(str_replace(["\r", "\n"], '', $value)));

        return match ($normalized) {
            'assigned' => self::Assigned,
            'pending/on hold', 'pending / on hold', 'pending on hold' => self::PendingOnHold,
            'in progress', 'inprogress' => self::InProgress,
            'closed', 'completed', 'resolved' => self::Closed,
            default => null,
        };
    }

    public function isOpen(): bool
    {
        return $this !== self::Closed;
    }
}
