<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $groups = [
            ['name' => 'DCO', 'slug' => 'dco'],
            ['name' => 'DSO', 'slug' => 'dso'],
            ['name' => 'DCO Shift', 'slug' => 'dco-shift'],
        ];

        foreach ($groups as $group) {
            \App\Models\Group::firstOrCreate(['slug' => $group['slug']], $group);
        }
    }
}
