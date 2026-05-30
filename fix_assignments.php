<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$assignments = App\Models\UserShiftAssignment::all();
foreach ($assignments as $assignment) {
    if (is_array($assignment->schedule)) {
        $oldSchedule = $assignment->schedule;
        // Check if it has key 0 and lacks key 7 (which indicates it shifted by 1)
        if (isset($oldSchedule[0])) {
            $newSchedule = [];
            for ($i = 1; $i <= 7; $i++) {
                // Map 0->1, 1->2 ... 6->7
                $newSchedule[$i] = $oldSchedule[$i - 1] ?? null;
            }
            $assignment->schedule = $newSchedule;
            $assignment->save();
            echo "Fixed assignment ID: {$assignment->id}\n";
        }
    }
}
echo "Done fixing assignments.\n";
