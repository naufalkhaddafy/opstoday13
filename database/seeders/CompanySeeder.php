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
                'name' => 'PT. Berca',
                'slug' => 'pt-berca',
                'whatsapp_group_number' => '6281234567890',
            ]),
            Company::factory()->create([
                'name' => 'PT. DCS',
                'slug' => 'pt-dcs',
                'whatsapp_group_number' => null,
            ]),
            Company::factory()->create([
                'name' => 'PT. MKN',
                'slug' => 'pt-mkn',
                'whatsapp_group_number' => null,
            ]),
        ];
    }
}
