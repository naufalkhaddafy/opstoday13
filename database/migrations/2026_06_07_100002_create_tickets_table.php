<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->unique();
            $table->string('category')->nullable();
            $table->string('sub_category')->nullable();
            $table->string('title')->nullable();
            $table->string('computer_name')->nullable();
            $table->string('requested_for')->nullable();
            $table->string('requested_by')->nullable();
            $table->string('status');
            $table->string('assigned_to_name')->nullable();
            $table->string('assigned_to_id')->nullable();
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('work_group')->nullable();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('status_changed_at')->nullable();
            $table->timestamp('disappeared_at')->nullable();
            $table->timestamp('in_progress_at')->nullable();
            $table->unsignedInteger('response_time_seconds')->nullable();
            $table->date('api_creation_date')->nullable();
            $table->date('completed_date')->nullable();
            $table->string('resolution_time')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->foreignId('sync_batch_id')->nullable()->constrained('ticket_sync_runs')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('assigned_to_id');
            $table->index('assigned_to_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
