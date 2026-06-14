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
        Schema::table('companies', function (Blueprint $table) {
            $table->json('whatsapp_groups')->nullable()->after('whatsapp_group_number');
        });

        // Migrate existing data
        \DB::table('companies')->orderBy('id')->chunk(100, function ($companies) {
            foreach ($companies as $company) {
                if (!empty($company->whatsapp_group_number)) {
                    \DB::table('companies')
                        ->where('id', $company->id)
                        ->update(['whatsapp_groups' => json_encode([$company->whatsapp_group_number])]);
                }
            }
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('whatsapp_group_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('whatsapp_group_number')->nullable()->after('whatsapp_groups');
        });

        // Revert data
        \DB::table('companies')->orderBy('id')->chunk(100, function ($companies) {
            foreach ($companies as $company) {
                if (!empty($company->whatsapp_groups)) {
                    $arr = json_decode($company->whatsapp_groups, true);
                    if (is_array($arr) && count($arr) > 0) {
                        \DB::table('companies')
                            ->where('id', $company->id)
                            ->update(['whatsapp_group_number' => $arr[0]]);
                    }
                }
            }
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('whatsapp_groups');
        });
    }
};
