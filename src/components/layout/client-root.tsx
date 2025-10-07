
"use client";

import { useLanguage } from '@/context/LanguageProvider';
import { useEffect } from 'react';

// This component is a client component that can safely use hooks.
// It applies the language direction and locale to the document's root element.
export function ClientRoot({ children }: { children: React.ReactNode }) {
  const { direction, locale } = useLanguage();

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }, [direction, locale]);

  return <>{children}</>;
}
