<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone_number')->nullable()->after('email');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->json('leave_approval_settings')->nullable()->after('whatsapp_groups');
        });

        Schema::create('user_leave_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_leave_id')->constrained()->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'waiting', 'approved', 'rejected', 'closed'])->default('pending');
            $table->integer('step_order')->default(1);
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('email_token_hash', 64)->nullable()->unique();
            $table->timestamp('email_token_expires_at')->nullable();
            $table->timestamp('email_token_used_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_leave_approvals');

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('leave_approval_settings');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('phone_number');
        });
    }
};
