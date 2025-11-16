// src/components/layout/page-layout.tsx

'use client';

import { usePathname } from 'next/navigation';
import { AppLayout } from './app-layout';

// این لیست شامل صفحاتی است که به AppLayout (سایدبار و هدر) نیاز **ندارند**.
const NO_LAYOUT_PAGES = ['/setup', '/role-selection', '/landing'];

export function PageLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // اگر مسیر فعلی در لیست صفحات بدون Layout است، فقط خود صفحه را رندر کن
    if (NO_LAYOUT_PAGES.includes(pathname)) {
        return <>{children}</>;
    }

    // در غیر این صورت، صفحه را در داخل AppLayout رندر کن
    return <AppLayout>{children}</AppLayout>;
}