<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where("name", "Abdul Saleh Arifin")->first();

$controller = app(\App\Http\Controllers\Admin\UserController::class);
$req = \App\Http\Requests\Admin\UpdateUserRequest::create("/admin/users/" . $user->id, "PUT", [
    "name" => $user->name,
    "email" => $user->email,
    "role" => "engineer",
    "is_active" => true,
    "is_verified" => true,
    "shift_schedule" => [1 => 1, 2 => 1, 3 => 1, 4 => 1, 5 => null, 6 => null, 7 => null],
    "shift_effective_from" => "2026-05-29"
]);
$req->setRouteResolver(function() use ($user) {
    return (new \Illuminate\Routing\Route("PUT", "/admin/users/{user}", []))->bind($user);
});
app()->instance(\App\Http\Requests\Admin\UpdateUserRequest::class, $req);

$controller->update($req, $user);

dump($user->shiftAssignments()->orderByDesc("effective_from")->get()->toArray());

