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
        Schema::create('schedule_logs', function (Blueprint $table) {
            $table->id();
            $table->string('command');
            $table->string('status');
            $table->longText('output')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->integer('duration')->nullable()->comment('Duration in milliseconds');
            $table->timestamps();
            
            $table->index(['command', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_logs');
    }
};
