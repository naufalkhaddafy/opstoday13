<?php

namespace App\Jobs;

use App\Mail\LeaveNotificationMail;
use App\Models\User;
use App\Models\UserLeave;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendLeaveNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     * $type can be: 'new_request', 'approved', 'rejected', 'reminder'
     */
    public function __construct(
        public UserLeave $leave,
        public string $type,
        public ?User $targetUser = null // The approver or the engineer
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $target = $this->targetUser;
        if (!$target) {
            return;
        }

        $notification = new LeaveNotificationMail($this->leave, $this->type, $target);
        $subject = $notification->notificationSubject();

        if ($target->email) {
            try {
                Mail::to($target->email)->send($notification);
            } catch (\Exception $e) {
                Log::error("Failed to send leave email to {$target->email}: " . $e->getMessage());
            }
        }

        // 2. Send WA via HTTP Request (Mock implementation for now)
        if ($target->phone_number) {
            try {
                // Here you would integrate with Fonnte, Watzap, or generic WA API.
                // Http::post('https://api.wa.provider.com/send', ['phone' => $target->phone_number, 'message' => $message]);
                Log::info("WA Notification queued for {$target->phone_number}: {$subject}");
            } catch (\Exception $e) {
                Log::error("Failed to send leave WA to {$target->phone_number}: " . $e->getMessage());
            }
        }
    }
}
