import { BRAND_LOGO_SRC } from '@/lib/brand';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary p-1">
                <img src={BRAND_LOGO_SRC} alt="b-hero" className="size-full object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">b-hero</span>
            </div>
        </>
    );
}
