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
        <div className={`relative overflow-hidden border-b ${BRAND_HEADER_BORDER} ${BRAND_HEADER_GRADIENT} text-white ${compact ? 'rounded-xl' : ''}`}>
            {/* Subtle radial glow for depth */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(76,175,80,0.12),transparent_70%)]" />
            <div
                className={`relative mx-auto flex max-w-7xl flex-col gap-4 px-4 md:px-6 ${compact ? 'py-4' : 'py-6 md:py-8'} ${actions ? 'lg:flex-row lg:items-center lg:justify-between' : ''}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`flex shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-xl ring-1 ring-white/60 ${compact ? 'h-16 w-16' : 'h-24 w-24 md:h-32 md:w-32'}`}>
                        <img
                            src={BRAND_LOGO_SRC}
                            alt="b-hero"
                            className="h-full w-full object-contain drop-shadow-2xl"
                        />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                        {badge && (
                            <span className="w-fit rounded-full bg-[#FDD835]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#FDD835]">
                                {badge}
                            </span>
                        )}
                        <h1 className={`font-bold tracking-tight ${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
                            {title}
                        </h1>
                        {subtitle && <p className="text-sm text-white/75">{subtitle}</p>}
                        {date && (
                            <p className="flex items-center gap-2 text-sm text-white/75">
                                <CalendarClock className="h-4 w-4 text-[#FDD835]/80" /> {date}
                            </p>
                        )}
                    </div>
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
            </div>
        </div>
    );
}
