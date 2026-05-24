<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status');
            $table->dateTime('punched_at');
            $table->date('work_date');
            $table->foreignId('sync_batch_id')->nullable()->constrained('attendance_sync_runs')->nullOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->unique(['employee_id', 'punched_at', 'status']);
            $table->index(['user_id', 'work_date']);
            $table->index('work_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
