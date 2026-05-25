import type React from 'react';

export type AdminCompany = {
    id: number;
    name: string;
};

export type AdminUserItem = {
    id: number;
    employee_id: string | null;
    name: string;
    email: string;
    role: string | null;
    company: AdminCompany | null;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
};

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type PaginationLinks = {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
};

export type PaginatedUsers = {
    data: AdminUserItem[];
    meta: PaginationMeta;
    links: PaginationLinks;
};
