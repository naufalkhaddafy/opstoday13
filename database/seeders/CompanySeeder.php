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
            Company::firstOrCreate(['slug' => 'pt-berca'], [
                'name' => 'PT. Berca',
                'whatsapp_group_number' => '6281234567890',
            ]),
            Company::firstOrCreate(['slug' => 'pt-dcs'], [
                'name' => 'PT. DCS',
                'whatsapp_group_number' => null,
            ]),
            Company::firstOrCreate(['slug' => 'pt-mkn'], [
                'name' => 'PT. MKN',
                'whatsapp_group_number' => null,
            ]),
        ];
    }
}
