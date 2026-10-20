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

export const LEAVE_TYPE_LABELS: Record<string, string> = {
    cuti: 'Annual Leave',
    sakit: 'Sick Leave',
    izin: 'Personal Leave',
};

export const LEAVE_TYPE_STYLES: Record<string, string> = {
    cuti: 'border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
    sakit: 'border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    izin: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export const BRAND_LOGO_SRC = '/icon/b-hero-icon.png';

export const BRAND_HEADER_GRADIENT =
    'bg-gradient-to-r from-[#0d1f12] via-[#1a4a1f] to-[#236b2a]';

export const BRAND_HEADER_BORDER = 'border-[#3a8f42]/30';

export const TICKET_STATUS_STYLES: Record<string, string> = {
    assigned:
        'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700',
    in_progress:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    pending_on_hold:
        'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
    closed:
        'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700',
};

export const APPROVAL_STEP_STATUS_STYLES: Record<string, string> = {
    closed: 'bg-muted text-muted-foreground border-border',
    approved:
        'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700',
    rejected:
        'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    pending:
        'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
    waiting:
        'bg-muted text-muted-foreground border-border',
};

export const APPROVAL_STEP_STATUS_LABELS: Record<string, string> = {
    approved: 'Disetujui',
    rejected: 'Ditolak',
    pending: 'Menunggu',
    waiting: 'Menunggu Giliran',
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
