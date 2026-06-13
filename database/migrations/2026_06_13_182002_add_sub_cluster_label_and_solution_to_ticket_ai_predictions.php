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
            $table->string('sub_cluster_label')->nullable()->after('cluster_label');
            $table->text('suggested_solution')->nullable()->after('sub_cluster_label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_ai_predictions', function (Blueprint $table) {
            $table->dropColumn(['sub_cluster_label', 'suggested_solution']);
        });
    }
};
