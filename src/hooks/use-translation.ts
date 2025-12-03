// src/hooks/use-translation.ts - FINAL UPGRADED VERSION

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

  // ✅ تغییر مهم: اضافه کردن آرگومان دوم به صورت اختیاری (params?)
  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(dictionary, key);

    // If translation is not found in the current locale, try falling back to English
    if (!value) {
      const fallbackValue = getNestedValue(translations.en, key);
      value = fallbackValue || key; // Return the key itself if no translation is found anywhere
    }

    // ✅ منطق جدید: جایگذاری متغیرها (Interpolation)
    // اگر پارامتری ارسال شده باشد، آن را در متن جایگزین می‌کند
    if (params && value) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        // تمام {{key}} ها را با مقدارشان عوض می‌کند
        value = value!.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }

    return value;
  };

  return { t, locale, direction };
}