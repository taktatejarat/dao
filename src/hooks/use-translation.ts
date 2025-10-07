'use client';

import { useLanguage } from '@/context/LanguageProvider';
import { translations } from '@/lib/i18n/locales';

// Helper function to access nested properties from a string path
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export function useTranslation() {
  const { locale, direction } = useLanguage();
  
  // Fallback to English if the current locale's dictionary is missing
  const dictionary = translations[locale] || translations.en;

  const t = (key: string): string => {
    const value = getNestedValue(dictionary, key);
    // If translation is not found in the current locale, try falling back to English
    if (!value) {
      const fallbackValue = getNestedValue(translations.en, key);
      return fallbackValue || key; // Return the key itself if no translation is found anywhere
    }
    return value;
  };

  return { t, locale, direction };
}
