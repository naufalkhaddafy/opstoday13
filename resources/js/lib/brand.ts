/**
 * b-hero brand palette — single source of truth for UI colors.
 * Logo: /public/icon/b-hero-icon.png
 */
export const BRAND = {
    dark: '#1B5E20',
    mid: '#2E7D32',
    light: '#4CAF50',
    yellow: '#FDD835',
    yellowDark: '#F9A825',
    black: '#0a0a0a',
} as const;

export const BRAND_LOGO_SRC = '/icon/b-hero-icon.png';

export const BRAND_HEADER_GRADIENT =
    'bg-gradient-to-r from-[#0d1f12] via-[#1a4a1f] to-[#236b2a]';

export const BRAND_HEADER_BORDER = 'border-[#3a8f42]/30';

export const TICKET_STATUS_STYLES: Record<string, string> = {
    assigned:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    in_progress:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    pending_on_hold:
        'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
    closed:
        'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700',
};

export const TICKET_CHART_COLORS = {
    assigned: BRAND.mid,
    pending: BRAND.yellow,
    inProgress: BRAND.light,
    completed: BRAND.dark,
} as const;

export const BRAND_PAGE_HEADER =
    'rounded-xl border bg-card text-card-foreground shadow-sm bg-gradient-to-br from-green-50/50 via-transparent to-transparent dark:from-green-950/10';

export const BRAND_ICON_BOX =
    'p-3 bg-green-50 dark:bg-green-950/50 text-[#2E7D32] dark:text-[#4CAF50] rounded-lg';
