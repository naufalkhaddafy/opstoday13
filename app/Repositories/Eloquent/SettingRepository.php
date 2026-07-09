<?php

namespace App\Repositories\Eloquent;

use App\Models\Setting;
use App\Repositories\Contracts\SettingRepositoryInterface;
use Illuminate\Support\Facades\Cache;

class SettingRepository implements SettingRepositoryInterface
{
    /**
     * Get all settings from cache or database.
     * @return \Illuminate\Support\Collection
     */
    private function getAllSettings()
    {
        return Cache::rememberForever('global_settings', function () {
            return Setting::all()->mapWithKeys(function ($setting) {
                return [$setting->key => [
                    'group' => $setting->group,
                    'key' => $setting->key,
                    'value' => $setting->value,
                    'type' => $setting->type,
                    'description' => $setting->description,
                ]];
            })->toArray();
        });
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $settings = $this->getAllSettings();
        
        if (!isset($settings[$key])) {
            return $default;
        }

        $setting = $settings[$key];
        
        return $this->castValue($setting['value'], $setting['type']);
    }

    public function getAllGrouped(): array
    {
        $settings = $this->getAllSettings();
        
        $grouped = [];
        foreach ($settings as $setting) {
            $group = $setting['group'];
            if (!isset($grouped[$group])) {
                $grouped[$group] = [];
            }
            
            $grouped[$group][$setting['key']] = [
                'value' => $this->castValue($setting['value'], $setting['type']),
                'type' => $setting['type'],
                'description' => $setting['description'],
            ];
        }
        
        return $grouped;
    }

    public function updateMany(array $settings): void
    {
        foreach ($settings as $key => $value) {
            // We use updateOrCreate in case a setting is missing
            $setting = Setting::where('key', $key)->first();
            
            if ($setting) {
                // If it's a boolean, we cast it back to string representation
                if (is_bool($value) || $setting->type === 'boolean') {
                    $value = $value ? '1' : '0';
                }
                
                $setting->update(['value' => (string) $value]);
            }
        }
        // Cache will be invalidated automatically by SettingObserver
    }

    /**
     * Cast the string value from DB to its actual type.
     */
    private function castValue(?string $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'integer' => (int) $value,
            'float' => (float) $value,
            'boolean' => in_array($value, ['1', 'true', 'on', 'yes'], true),
            'json' => json_decode($value, true),
            default => $value,
        };
    }
}
