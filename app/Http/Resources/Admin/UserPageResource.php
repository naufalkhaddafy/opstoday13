<?php

namespace App\Http\Resources\Admin;

use App\Enums\RoleName;
use App\Models\Company;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserPageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $paginator = $this->resource['users'];

        return [
            'users' => [
                'data' => UserListResource::collection($paginator->items())->resolve(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                    'links' => $paginator->linkCollection()->toArray(),
                ],
                'links' => [
                    'first' => $paginator->url(1),
                    'last' => $paginator->url($paginator->lastPage()),
                    'prev' => $paginator->previousPageUrl(),
                    'next' => $paginator->nextPageUrl(),
                ],
            ],
            'companies' => Company::select('id', 'name')->get()->toArray(),
            'groups' => Group::select('id', 'name')->get()->toArray(),
            'roles' => array_column(RoleName::cases(), 'value'),
            'filters' => $this->resource['filters'],
        ];
    }
}
