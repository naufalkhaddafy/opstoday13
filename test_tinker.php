
$user = \App\Models\User::first();
$active = $user->shiftAssignments()->first();
dump("Before:", $active->schedule);

$controller = app(\App\Http\Controllers\Admin\UserController::class);
// Mock request
$request = \App\Http\Requests\Admin\UpdateUserRequest::create("/admin/users/{$user->id}", "PUT", [
    "name" => $user->name,
    "email" => $user->email,
    "role" => "dco",
    "is_active" => true,
    "is_verified" => true,
    "shift_schedule" => [1 => 2, 2 => 2, 3 => 2, 4 => null, 5 => null, 6 => null, 7 => null],
    "shift_effective_from" => now()->toDateString(),
]);
$request->setRouteResolver(function () use ($user) {
    return (new \Illuminate\Routing\Route("PUT", "/admin/users/{user}", []))->bind($user);
});
app()->instance(\App\Http\Requests\Admin\UpdateUserRequest::class, $request);

try {
    $controller->update($request, $user);
    $activeAfter = $user->shiftAssignments()->orderByDesc("effective_from")->first();
    dump("After:", $activeAfter->schedule);
} catch (\Exception $e) {
    dump("Exception:", $e->getMessage());
}

