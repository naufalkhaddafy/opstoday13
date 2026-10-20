<?php

use App\Enums\RoleName;
use App\Jobs\SendLeaveNotificationJob;
use App\Mail\LeaveNotificationMail;
use App\Models\Company;
use App\Models\Group;
use App\Models\User;
use App\Models\UserLeave;
use App\Models\UserLeaveApproval;
use App\Services\Leave\LeaveApprovalLinkService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Queue::fake();
    $this->withoutVite();
    $this->company = Company::create(['name' => 'Approval Test Company', 'slug' => 'approval-test-company']);
    Group::create(['name' => 'Approval Test Group', 'slug' => 'approval-test-group']);
    $this->owner = User::factory()->forCompany($this->company)->create();
    $this->approver = User::factory()->create();
    $this->other = User::factory()->create();
    $this->leave = UserLeave::create([
        'user_id' => $this->owner->id, 'type' => 'cuti', 'start_date' => '2026-10-20',
        'end_date' => '2026-10-21', 'status' => 'pending', 'description' => '<script>alert(1)</script>',
    ]);
    $this->task = UserLeaveApproval::create([
        'user_leave_id' => $this->leave->id, 'approver_id' => $this->approver->id,
        'status' => 'pending', 'step_order' => 1,
    ]);
    $this->links = app(LeaveApprovalLinkService::class)->issue($this->leave, $this->approver);
    parse_str(parse_url($this->links['approve'], PHP_URL_QUERY), $query);
    $this->token = $query['token'];
    $this->postUrl = route('leave-approval-actions.store', ['approval' => $this->task, 'action' => 'approve']);
});

it('requires login and preserves the intended email link', function () {
    $this->get($this->links['approve'])->assertRedirect(route('login'));
    expect(session('url.intended'))->toBe($this->links['approve']);
    expect($this->task->fresh()->status)->toBe('pending');
});

it('renders without changing status and only exposes safe data', function () {
    $this->actingAs($this->approver)->get($this->links['approve'])
        ->assertOk()->assertHeader('Referrer-Policy', 'no-referrer')
        ->assertInertia(fn (Assert $page) => $page->component('leaves/email-action')
            ->where('action', 'approve')->where('error', null)->missing('email_token_hash'));
    expect($this->task->fresh()->status)->toBe('pending');
    expect($this->task->fresh()->email_token_used_at)->toBeNull();
});

it('rejects another account including a super admin', function () {
    Role::findOrCreate(RoleName::SuperAdmin->value);
    $this->other->assignRole(RoleName::SuperAdmin->value);
    $this->actingAs($this->other)->get($this->links['approve'])->assertForbidden();
    $this->post($this->postUrl, ['token' => $this->token])->assertForbidden();
    expect($this->leave->fresh()->status)->toBe('pending');
});

it('approves once and closes other tasks and tokens for any one approver', function () {
    $otherTask = UserLeaveApproval::create([
        'user_leave_id' => $this->leave->id, 'approver_id' => $this->other->id, 'status' => 'pending',
    ]);
    $otherLinks = app(LeaveApprovalLinkService::class)->issue($this->leave, $this->other);
    $this->actingAs($this->approver)->post($this->postUrl, ['token' => $this->token])->assertRedirect(route('leave-approval-actions.result', $this->task));
    expect($this->leave->fresh()->status)->toBe('approved');
    expect($this->task->fresh()->email_token_used_at)->not->toBeNull();
    expect($otherTask->fresh()->status)->toBe('closed');
    expect($otherTask->fresh()->email_token_used_at)->not->toBeNull();
    $this->postJson($this->postUrl, ['token' => $this->token])->assertUnprocessable()->assertJsonValidationErrors('token');
    $this->actingAs($this->other)->get($otherLinks['approve'])->assertInertia(fn (Assert $page) => $page
        ->where('error', 'This approval has already been processed or closed.')->where('token', null));
    parse_str(parse_url($otherLinks['approve'], PHP_URL_QUERY), $otherQuery);
    $this->postJson(route('leave-approval-actions.store', ['approval' => $otherTask, 'action' => 'approve']), ['token' => $otherQuery['token']])
        ->assertUnprocessable()->assertJsonValidationErrors('token');
    Queue::assertPushed(SendLeaveNotificationJob::class, 1);
});

it('rejects tampered and expired tokens without consuming a task', function () {
    $this->actingAs($this->approver)->postJson($this->postUrl, ['token' => str_repeat('x', 64)])
        ->assertUnprocessable()->assertJsonValidationErrors('token');
    $this->task->update(['email_token_expires_at' => now()->subSecond()]);
    $this->postJson($this->postUrl, ['token' => $this->token])->assertUnprocessable()->assertJsonValidationErrors('token');
    expect($this->task->fresh()->status)->toBe('pending');
    Queue::assertNothingPushed();
});

it('requires a rejection reason and invalidates both actions after rejection', function () {
    $url = route('leave-approval-actions.store', ['approval' => $this->task, 'action' => 'reject']);
    $this->actingAs($this->approver)->postJson($url, ['token' => $this->token])
        ->assertUnprocessable()->assertJsonValidationErrors('rejection_reason');
    $this->post($url, ['token' => $this->token, 'rejection_reason' => 'Insufficient staffing'])->assertRedirect();
    expect($this->leave->fresh()->status)->toBe('rejected');
    expect($this->task->fresh()->rejection_reason)->toBe('Insufficient staffing');
    $this->postJson($this->postUrl, ['token' => $this->token])->assertUnprocessable();
    Queue::assertPushed(SendLeaveNotificationJob::class, 1);
});

it('invalidates email tokens when a decision comes from the dashboard', function () {
    $url = route('admin.leave-approvals.approve', $this->task);
    $this->actingAs($this->approver)->post($url)->assertRedirect();
    $this->postJson($this->postUrl, ['token' => $this->token])->assertUnprocessable();
    expect($this->leave->fresh()->status)->toBe('approved');
    Queue::assertPushed(SendLeaveNotificationJob::class, 1);
});

it('waits for all approvers in parallel all workflow', function () {
    $this->company->update(['leave_approval_settings' => ['requirement' => 'all', 'workflow_type' => 'parallel']]);
    $second = UserLeaveApproval::create(['user_leave_id' => $this->leave->id, 'approver_id' => $this->other->id, 'status' => 'pending']);
    $this->actingAs($this->approver)->post($this->postUrl, ['token' => $this->token])->assertRedirect();
    expect($this->leave->fresh()->status)->toBe('pending');
    expect($second->fresh()->status)->toBe('pending');
    $this->actingAs($this->other)->post(route('admin.leave-approvals.approve', $second))->assertRedirect();
    expect($this->leave->fresh()->status)->toBe('approved');
});

it('activates only the next sequential task after approval', function () {
    $this->company->update(['leave_approval_settings' => ['requirement' => 'all', 'workflow_type' => 'sequential']]);
    $second = UserLeaveApproval::create(['user_leave_id' => $this->leave->id, 'approver_id' => $this->other->id, 'status' => 'waiting', 'step_order' => 2]);
    expect(app(LeaveApprovalLinkService::class)->issue($this->leave, $this->other))->toBe([]);
    $this->actingAs($this->approver)->post($this->postUrl, ['token' => $this->token])->assertRedirect();
    expect($this->leave->fresh()->status)->toBe('pending');
    expect($second->fresh()->status)->toBe('pending');
    Queue::assertPushed(SendLeaveNotificationJob::class, fn ($job) => $job->type === 'new_request' && $job->targetUser->id === $this->other->id);
});

it('renders three email buttons with hashed single use tokens and escaped details', function () {
    $mail = new LeaveNotificationMail($this->leave, 'new_request', $this->approver);
    $html = $mail->render();
    expect($html)->toContain('>Approve</a>', '>Reject</a>', 'View Pending Approvals', '&lt;script&gt;');
    expect($this->task->fresh()->email_token_hash)->not->toBe($this->token);
    expect($this->task->fresh()->toArray())->not->toHaveKey('email_token_hash');
    expect($mail->render())->toBe($html);
    $this->actingAs($this->approver)->postJson($this->postUrl, ['token' => $this->token])->assertUnprocessable();
});

it('returns to the email action after password login', function () {
    $this->get($this->links['approve'])->assertRedirect(route('login'));
    $this->post(route('login.store'), ['email' => $this->approver->email, 'password' => 'password'])
        ->assertRedirect($this->links['approve']);
    $this->get($this->links['approve'])->assertInertia(fn (Assert $page) => $page
        ->component('leaves/email-action')->where('action', 'approve')->where('error', null));
    expect($this->task->fresh()->status)->toBe('pending');
});

it('shows persistent approval details without a token or another decision on refresh', function () {
    $resultUrl = route('leave-approval-actions.result', $this->task);
    $this->actingAs($this->approver)->get($resultUrl)->assertNotFound();
    $this->post($this->postUrl, ['token' => $this->token])->assertRedirect($resultUrl);
    for ($refresh = 0; $refresh < 2; $refresh++) {
        $this->get($resultUrl)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('leaves/email-action')->where('token', null)->where('decisionUrl', null)
            ->where('approvalResult.approver', $this->approver->name)
            ->where('approvalResult.leaveStatus', 'approved')->where('approvalResult.leaveType', 'cuti')
            ->missing('email_token_hash'));
    }
    Queue::assertPushed(SendLeaveNotificationJob::class, 1);
    $this->actingAs($this->other)->get($resultUrl)->assertForbidden();
});

it('distinguishes an individual approval from a pending all-approver request', function () {
    $this->company->update(['leave_approval_settings' => ['requirement' => 'all', 'workflow_type' => 'parallel']]);
    UserLeaveApproval::create(['user_leave_id' => $this->leave->id, 'approver_id' => $this->other->id, 'status' => 'pending']);
    $this->actingAs($this->approver)->post($this->postUrl, ['token' => $this->token])->assertRedirect();
    $this->get(route('leave-approval-actions.result', $this->task))->assertInertia(fn (Assert $page) => $page
        ->where('approvalResult.leaveStatus', 'pending')->where('decisionUrl', null));
});
