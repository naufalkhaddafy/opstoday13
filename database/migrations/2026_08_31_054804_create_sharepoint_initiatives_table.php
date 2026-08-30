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
        Schema::create('sharepoint_initiatives', function (Blueprint $table) {
            $table->id();
            $table->string('sharepoint_item_id')->index(); // The original ID from SharePoint
            $table->string('title')->nullable();
            $table->string('status')->nullable();
            $table->string('impact_level')->nullable();
            $table->string('target_timeline')->nullable();
            $table->date('submission_date')->nullable()->index(); // Extracted date for fast filtering
            $table->json('raw_data')->nullable(); // Kept for details in the UI
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sharepoint_initiatives');
    }
};
