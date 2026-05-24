<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    /**
     * @var list<Company>
     */
    public static array $companies = [];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        self::$companies = [
            Company::factory()->create([
                'name' => 'OpsToday HQ',
                'slug' => 'opstoday-hq',
                'whatsapp_group_number' => '6281234567890',
            ]),
            Company::factory()->create([
                'name' => 'OpsToday Branch',
                'slug' => 'opstoday-branch',
                'whatsapp_group_number' => null,
            ]),
        ];
    }
}
