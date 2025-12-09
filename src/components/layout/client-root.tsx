// src/components/layout/client-root.tsx

"use client";

import { useLanguage } from '@/context/LanguageProvider';
import { useEffect } from 'react';

export function ClientRoot({ children }: { children: React.ReactNode }) {
  const { direction, locale } = useLanguage();

  useEffect(() => {
    // اعمال اجباری جهت و زبان به تگ ریشه
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
    
    // اضافه کردن کلاس rtl/ltr برای استفاده در Tailwind (اختیاری)
    if (direction === 'rtl') {
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
    } else {
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
    }
  }, [direction, locale]);

  return <>{children}</>;
}