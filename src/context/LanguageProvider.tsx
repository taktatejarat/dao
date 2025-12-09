// src/context/LanguageProvider.tsx

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Direction = 'rtl' | 'ltr';
export type Locale = 'fa' | 'en' | 'ar' | 'ru' | 'de' | 'tr';

interface LanguageContextProps {
  locale: Locale;
  direction: Direction;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// کانفیگ جهت زبان‌ها
const localeConfig: Record<Locale, { direction: Direction }> = {
    fa: { direction: 'rtl' },
    en: { direction: 'ltr' },
    ar: { direction: 'rtl' },
    ru: { direction: 'ltr' },
    de: { direction: 'ltr' },
    tr: { direction: 'ltr' },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // پیش‌فرض فارسی
  const [locale, setLocaleState] = useState<Locale>('fa'); 
  const direction = localeConfig[locale].direction;

  useEffect(() => {
    // خواندن زبان از لوکال استوریج در کلاینت
    const storedLocale = localStorage.getItem('locale') as Locale | null;
    if (storedLocale && localeConfig[storedLocale]) {
      setLocaleState(storedLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (localeConfig[newLocale]) {
      localStorage.setItem('locale', newLocale);
      setLocaleState(newLocale);
      // تغییر اتریبیوت HTML برای اعمال فوری استایل‌ها
      document.documentElement.lang = newLocale;
      document.documentElement.dir = localeConfig[newLocale].direction;
    }
  }, []);

  // همگام‌سازی اولیه HTML با استیت
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);
  
  const value = {
    locale,
    direction,
    setLocale,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}