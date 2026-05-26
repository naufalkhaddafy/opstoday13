import type React from 'react';

export type AdminCompany = {
    id: number;
    name: string;
};

export type AdminCompanyItem = {
    id: number;
    name: string;
    slug: string;
    whatsapp_group_number: string | null;
    users_count: number;
    created_at: string;
};

export type AdminShiftItem = {
    id: number;
    code: string;
    name: string;
    time_window: string;
    is_overnight: boolean;
    type: string;
    assignments_count: number;
};

export type AdminAssignmentItem = {
    id: number;
    user: { id: number; name: string; employee_id: string | null };
    shift: { id: number; name: string; code: string };
    effective_from: string;
    effective_to: string | null;
    days_of_week: number[] | null;
};

export type AdminUserItem = {
    id: number;
    employee_id: string | null;
    name: string;
    email: string;
    role: string | null;
    company: AdminCompany | null;
    active_assignment: {
        id: number;
        days_of_week: number[] | null;
        shift: {
            id: number;
            name: string;
            code: string;
        } | null;
    } | null;
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

export type PaginatedCompanies = {
    data: AdminCompanyItem[];
    meta: PaginationMeta;
    links: PaginationLinks;
};

export type PaginatedShifts = {
    data: AdminShiftItem[];
    meta: PaginationMeta;
    links: PaginationLinks;
};

export type PaginatedAssignments = {
    data: AdminAssignmentItem[];
    meta: PaginationMeta;
    links: PaginationLinks;
};



