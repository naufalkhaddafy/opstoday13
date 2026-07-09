<?php

namespace App\Repositories\Contracts;

interface SettingRepositoryInterface
{
    /**
     * Get a setting value by key, or return default if not found.
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function get(string $key, mixed $default = null): mixed;

    /**
     * Get all settings grouped by their group name.
     * @return array<string, array<string, mixed>>
     */
    public function getAllGrouped(): array;

    /**
     * Update multiple settings.
     * @param array<string, mixed> $settings Key-value pairs of settings to update.
     */
    public function updateMany(array $settings): void;
}
