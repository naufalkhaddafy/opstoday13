import type { ImgHTMLAttributes } from 'react';
import { BRAND_LOGO_SRC } from '@/lib/brand';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return <img {...props} src={BRAND_LOGO_SRC} alt="b-hero icon" />;
}
