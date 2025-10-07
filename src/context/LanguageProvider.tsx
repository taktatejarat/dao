
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

const localeConfig: Record<Locale, { direction: Direction }> = {
    fa: { direction: 'rtl' },
    en: { direction: 'ltr' },
    ar: { direction: 'rtl' },
    ru: { direction: 'ltr' },
    de: { direction: 'ltr' },
    tr: { direction: 'ltr' },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fa'); // Default locale
  const direction = localeConfig[locale].direction;

  useEffect(() => {
    // This effect now runs only on the client
    const storedLocale = localStorage.getItem('locale') as Locale | null;
    if (storedLocale && localeConfig[storedLocale]) {
      setLocaleState(storedLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (localeConfig[newLocale]) {
      localStorage.setItem('locale', newLocale);
      setLocaleState(newLocale);
    }
  }, []);

  // Effect to update the DOM when locale or direction changes
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
