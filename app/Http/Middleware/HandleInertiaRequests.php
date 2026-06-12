<?php

namespace App\Http\Middleware;

use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user()
                    ? UserResource::make(
                        $request->user()->load(['roles', 'company'])
                    )->resolve()
                    : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'app_version' => env('APP_VERSION', 'local'),
            'changelog_data' => fn () => $this->parseChangelog(),
        ];
    }

    private function parseChangelog(): array
    {
        $changelogPath = base_path('CHANGELOG.md');
        if (!file_exists($changelogPath)) {
            return [];
        }

        $content = file_get_contents($changelogPath);
        $versions = [];
        // Pattern matches: ## [version] - date
        preg_match_all('/##\s+\[(.*?)\]\s+-\s+(\d{4}-\d{2}-\d{2})(.*?)(?=(?:##\s+\[)|$)/s', $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $versionNum = $match[1];
            $date = $match[2];
            $body = trim($match[3]);

            $categories = [];
            // Pattern matches: ### CategoryName
            preg_match_all('/###\s+(Added|Changed|Deprecated|Removed|Fixed|Security)(.*?)(?=(?:###\s+)|$)/is', $body, $catMatches, PREG_SET_ORDER);
            
            foreach ($catMatches as $catMatch) {
                $catName = $catMatch[1];
                $rawItems = array_values(array_filter(array_map('trim', explode("\n", trim($catMatch[2])))));
                
                $catItems = array_map(function($item) {
                    // Clean list markers
                    $item = preg_replace('/^[-*]\s+/', '', $item);
                    // Simple markdown to HTML
                    $item = preg_replace('/\*\*(.*?)\*\*/', '<strong class="text-foreground">$1</strong>', $item);
                    $item = preg_replace('/`(.*?)`/', '<code class="px-1 py-0.5 rounded-md bg-muted text-[10px] font-mono">$1</code>', $item);
                    $item = preg_replace('/_(.*?)_/', '<em>$1</em>', $item);
                    return $item;
                }, $rawItems);

                $categories[$catName] = $catItems;
            }

            $versions[] = [
                'version' => $versionNum,
                'date' => $date,
                'categories' => $categories
            ];
        }

        return $versions;
    }
}
