<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_assignment_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->string('from_assigned_to_id')->nullable();
            $table->string('to_assigned_to_id')->nullable();
            $table->timestamp('changed_at');
            $table->foreignId('sync_run_id')->nullable()->constrained('ticket_sync_runs')->nullOnDelete();
            $table->timestamps();

            $table->index('ticket_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_assignment_histories');
    }
};
