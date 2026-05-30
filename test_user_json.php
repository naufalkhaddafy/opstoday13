<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where("name", "Abdul Saleh Arifin")->first();
$active = $user->shiftAssignments()->orderByDesc("effective_from")->first();
dump("Raw Array:", $active->schedule);
dump("JSON Encoded:", json_encode($active->schedule));

