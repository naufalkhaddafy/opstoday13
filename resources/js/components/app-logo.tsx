import { BRAND_LOGO_SRC } from '@/lib/brand';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-white shadow-sm border p-1">
                <img src={BRAND_LOGO_SRC} alt="B-Hero" className="size-full object-contain" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold text-lg">B-Hero</span>
            </div>
        </>
    );
}
