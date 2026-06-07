import type { ReactNode } from 'react';
import { CalendarClock } from 'lucide-react';
import { BRAND_HEADER_BORDER, BRAND_HEADER_GRADIENT, BRAND_LOGO_SRC } from '@/lib/brand';

type BrandHeroHeaderProps = {
    title: string;
    subtitle?: string;
    badge?: string;
    date?: string;
    compact?: boolean;
    actions?: ReactNode;
};

export function BrandHeroHeader({ title, subtitle, badge, date, compact = false, actions }: BrandHeroHeaderProps) {
    return (
        <div className={`border-b ${BRAND_HEADER_BORDER} ${BRAND_HEADER_GRADIENT} text-white ${compact ? 'rounded-xl' : ''}`}>
            <div
                className={`mx-auto flex max-w-7xl flex-col gap-4 px-4 md:px-6 ${compact ? 'py-4' : 'py-6 md:py-8'} ${actions ? 'lg:flex-row lg:items-center lg:justify-between' : ''}`}
            >
                <div className="flex items-center gap-4">
                    <img
                        src={BRAND_LOGO_SRC}
                        alt="b-hero"
                        className={`shrink-0 object-contain ${compact ? 'h-10 w-10' : 'h-14 w-14 md:h-16 md:w-16'}`}
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                        {badge && (
                            <span className="text-xs font-semibold uppercase tracking-widest text-[#FDD835]">
                                {badge}
                            </span>
                        )}
                        <h1 className={`font-bold tracking-tight ${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
                            {title}
                        </h1>
                        {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
                        {date && (
                            <p className="flex items-center gap-2 text-sm text-white/80">
                                <CalendarClock className="h-4 w-4 text-[#FDD835]" /> {date}
                            </p>
                        )}
                    </div>
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
            </div>
        </div>
    );
}
