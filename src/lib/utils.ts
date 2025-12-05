// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ تبدیل‌گر هوشمند اعداد (Fixed)
export function formatNumber(
  value: number | string | bigint | undefined | null, 
  locale: string = 'en', 
  options?: Intl.NumberFormatOptions
): string {
  if (value === undefined || value === null || value === '') return '0';

  const num = Number(value);
  
  // اگر مقدار ورودی عدد معتبر نیست، همان رشته را برگردان (شاید متن باشد)
  if (isNaN(num)) return String(value);

  const defaultOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options
  };

  // ۱. فرمت استاندارد انگلیسی (سه رقم سه رقم)
  let formatted = new Intl.NumberFormat('en-US', defaultOptions).format(num);

  // ۲. تبدیل ارقام برای زبان‌های راست‌چین
  if (locale === 'fa') {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  }

  if (locale === 'ar') {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return formatted.replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
  }

  return formatted;
}

export function formatAddress(address: string | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatLocaleDate(date: Date, locale: string = 'en', options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : locale === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...options
    }).format(date);
  } catch (e) {
    return date.toLocaleDateString();
  }
}