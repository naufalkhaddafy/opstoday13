<?php

namespace App\Mail;

use App\Models\User;
use App\Models\UserLeave;
use App\Services\Leave\LeaveApprovalLinkService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use InvalidArgumentException;

class LeaveNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    private ?array $decisionLinks = null;

    public function __construct(
        public UserLeave $leave,
        public string $type,
        public User $recipient,
    ) {}

    public function notificationSubject(): string
    {
        return match ($this->type) {
            'new_request' => 'New Leave Request: '.$this->leave->user->name,
            'reminder' => 'Reminder: Pending Leave Request from '.$this->leave->user->name,
            'approved' => 'Your Leave Request Has Been Approved',
            'rejected' => 'Your Leave Request Has Been Rejected',
            'auto_approved_info' => 'Leave Request Automatically Approved: '.$this->leave->user->name,
            default => throw new InvalidArgumentException('Unsupported leave notification type.'),
        };
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->notificationSubject());
    }

    public function content(): Content
    {
        $intro = match ($this->type) {
            'new_request' => 'A new leave request is awaiting your approval. Please review the details below.',
            'reminder' => 'This leave request is still awaiting your approval. Please review it when possible.',
            'approved' => 'Your leave request has been fully approved.',
            'rejected' => 'Your leave request has been rejected. Please review the reason below.',
            'auto_approved_info' => 'This leave request was automatically approved according to the approval rules. This email is for your information.',
            default => throw new InvalidArgumentException('Unsupported leave notification type.'),
        };

        $details = [
            'Engineer' => $this->leave->user->name,
            'Company' => $this->leave->user->company?->name ?? '-',
            'Leave Type' => match ($this->leave->type) {
                'cuti' => 'Annual Leave',
                'sakit' => 'Sick Leave',
                'izin' => 'Personal Leave',
                default => $this->leave->type,
            },
            'Start Date' => $this->leave->start_date->format('d M Y'),
            'End Date' => $this->leave->end_date->format('d M Y'),
            'Description' => $this->leave->description ?: '-',
        ];

        if ($this->type === 'rejected') {
            $details['Reason for Rejection'] = $this->leave->approvals()
                ->where('status', 'rejected')->first()?->rejection_reason ?? '-';
        }

        $needsApproval = in_array($this->type, ['new_request', 'reminder'], true);
        if ($needsApproval && $this->decisionLinks === null) {
            $this->decisionLinks = app(LeaveApprovalLinkService::class)->issue($this->leave, $this->recipient);
        }

        return new Content(view: 'emails.leaves.notification', with: [
            'subject' => $this->notificationSubject(),
            'intro' => $intro,
            'details' => $details,
            'decisionLinks' => $this->decisionLinks ?? [],
            'actionUrl' => url($needsApproval ? '/admin/leave-approvals' : '/leaves'),
            'actionLabel' => $needsApproval ? 'View Pending Approvals' : 'View Leave Requests',
        ]);
    }
}
