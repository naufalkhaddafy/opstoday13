export type UserCompany = {
    id: number;
    name: string;
    slug: string;
    whatsapp_group_number: string | null;
};

export type User = {
    id: number;
    employee_id: string | null;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    is_verified: boolean;
    is_active: boolean;
    last_active_at: string | null;
    role?: string | null;
    company?: UserCompany | null;
    group?: { id: number; name: string; slug: string } | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
