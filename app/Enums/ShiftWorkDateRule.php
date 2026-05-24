<?php

namespace App\Enums;

enum ShiftWorkDateRule: string
{
    case CalendarDay = 'calendar_day';
    case NextDay = 'next_day';
}
