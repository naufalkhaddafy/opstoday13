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
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['ai_category', 'ai_keyword', 'ai_confidence_score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('ai_category')->nullable()->after('category');
            $table->string('ai_keyword')->nullable()->after('ai_category');
            $table->decimal('ai_confidence_score', 5, 4)->nullable()->after('ai_keyword');
        });
    }
};
