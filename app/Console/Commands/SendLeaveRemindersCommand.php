<?php

namespace App\Console\Commands;

use App\Jobs\SendLeaveNotificationJob;
use App\Models\UserLeaveApproval;
use Illuminate\Console\Command;
use Carbon\Carbon;

class SendLeaveRemindersCommand extends Command
{
    protected $signature = 'leave:send-reminders';
    protected $description = 'Send reminder notifications for pending leave approvals older than 24 hours';

    public function handle()
    {
        // Find approvals that are pending and were created more than 24 hours ago
        $pendingApprovals = UserLeaveApproval::with(['leave.user', 'approver'])
            ->where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subHours(24))
            ->get();

        $count = 0;
        foreach ($pendingApprovals as $approval) {
            // Only remind if the parent leave is still pending
            if ($approval->leave && $approval->leave->status === 'pending') {
                // If it's a sequential workflow, we should only remind if it's their turn.
                // Assuming active step is always the one currently pending.
                SendLeaveNotificationJob::dispatch($approval->leave, 'reminder', $approval->approver);
                $count++;
            }
        }

        $this->info("Sent {$count} reminders.");
    }
}
