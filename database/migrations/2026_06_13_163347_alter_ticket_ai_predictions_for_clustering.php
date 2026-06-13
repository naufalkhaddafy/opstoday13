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
        Schema::table('ticket_ai_predictions', function (Blueprint $table) {
            $table->dropColumn(['category', 'keyword', 'confidence_score']);
            $table->integer('cluster_id')->nullable()->after('ticket_id');
            $table->string('cluster_label')->nullable()->after('cluster_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_ai_predictions', function (Blueprint $table) {
            $table->dropColumn(['cluster_id', 'cluster_label']);
            $table->string('category')->nullable();
            $table->string('keyword')->nullable();
            $table->decimal('confidence_score', 5, 4)->nullable();
        });
    }
};
