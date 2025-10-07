import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Locale } from "@/context/LanguageProvider";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function formatNumber(
  value: number | string | bigint,
  locale: Locale = 'en',
  options?: Intl.NumberFormatOptions
): string {
    const numericValue = Number(value);
    
    if (isNaN(numericValue)) {
        return String(value);
    }
    
    const defaultOptions: Intl.NumberFormatOptions = {
        maximumFractionDigits: 3,
        ...options,
    };
    
    const formatter = new Intl.NumberFormat(locale, defaultOptions);
    let formattedValue = formatter.format(numericValue);

    if (locale === 'fa') {
        formattedValue = formattedValue.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
    } else if (locale === 'ar') {
        formattedValue = formattedValue.replace(/[0-9]/g, (d) => ARABIC_DIGITS[parseInt(d, 10)]);
    }

    return formattedValue;
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
