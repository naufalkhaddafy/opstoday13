<?php

namespace App\Enums;

enum RoleName: string
{
    case SuperAdmin = 'super_admin';
    case Supv = 'supv';
    case Engineer = 'engineer';
}
