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
        Schema::create('sharepoint_data', function (Blueprint $table) {
            $table->id();
            $table->string('site_id')->nullable()->index();
            $table->string('list_id')->nullable()->index();
            $table->string('sharepoint_item_id')->index();
            $table->string('type')->index(); // e.g., 'initiative', 'milestone', etc.
            $table->json('data');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'list_id', 'sharepoint_item_id'], 'sharepoint_item_unique_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sharepoint_data');
    }
};
