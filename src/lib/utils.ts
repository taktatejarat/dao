import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Locale } from "@/context/LanguageProvider";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(
  value: number | string | bigint | undefined | null,
  locale: Locale = 'en',
  options: Intl.NumberFormatOptions = {}
): string {
    // 1. Handle null/undefined/empty inputs safely
    if (value === undefined || value === null || value === '') {
        return '0';
    }

    // 2. The Intl.NumberFormat API can handle bigint directly, preventing precision loss.
    // We only need to convert strings to numbers.
    let valueToFormat: number | bigint;
    if (typeof value === 'bigint') {
        valueToFormat = value;
    } else {
        const num = Number(value);
        if (isNaN(num)) {
            return '0'; // Return '0' for invalid numbers
        }
        valueToFormat = num;
    }

    const defaultOptions: Intl.NumberFormatOptions = {
        maximumFractionDigits: 4, // Show up to 4 decimal places
        ...options,
    };

    // 3. Use Unicode extension to force Latin digits (0,1,2,3...) for all locales.
    // This provides a consistent financial data representation across the app.
    // 'fa-IR' becomes 'fa-IR-u-nu-latn'
    const effectiveLocale = `${locale}-u-nu-latn`;

    try {
        return new Intl.NumberFormat(effectiveLocale, defaultOptions).format(valueToFormat);
    } catch (e) {
        // Fallback to default locale if the combined locale is not supported
        return new Intl.NumberFormat(locale, defaultOptions).format(valueToFormat);
    }
}

export function formatLocaleDate(
    date: Date,
    locale: Locale,
    options: Intl.DateTimeFormatOptions = {}
): string {
    let effectiveLocale = locale;
    let calendar: 'persian' | 'islamic-umalqura' | 'gregory' | undefined;

    if (locale === 'fa') {
        calendar = 'persian';
        effectiveLocale = 'fa-IR' as Locale;
    } else if (locale === 'ar') {
        calendar = 'islamic-umalqura';
        effectiveLocale = 'ar-SA' as Locale;
    }

    const finalOptions: Intl.DateTimeFormatOptions = {
        ...options
    };
    
    if (calendar) {
        finalOptions.calendar = calendar;
    }
    
    return new Intl.DateTimeFormat(effectiveLocale, finalOptions).format(date);
  }

export function formatAddress(address?: string): string {
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
      return '';
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
