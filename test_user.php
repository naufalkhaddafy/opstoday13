<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where("name", "Abdul Saleh Arifin")->first();
if ($user) {
    dump($user->shiftAssignments()->get()->toArray());
}
