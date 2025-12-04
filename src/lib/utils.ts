// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ اصلاح شده: تبدیل هوشمند اعداد بر اساس زبان (Persian/Arabic/Latin)
export function formatNumber(
  value: number | string | bigint, 
  locale: string = 'en', 
  options?: Intl.NumberFormatOptions
): string {
  if (value === undefined || value === null) return '0';

  const num = Number(value);

  // تنظیمات پیش‌فرض (حداکثر ۲ رقم اعشار)
  const defaultOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options
  };

  // ۱. ابتدا عدد را با فرمت استاندارد انگلیسی (سه رقم سه رقم) تولید می‌کنیم
  // این کار باعث می‌شود جداکننده هزارگان (,) همیشه درست باشد
  let formatted = new Intl.NumberFormat('en-US', defaultOptions).format(num);

  // ۲. اگر زبان فارسی بود، ارقام را جایگزین کن
  if (locale === 'fa') {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  }

  // ۳. اگر زبان عربی بود، ارقام عربی شرقی را جایگزین کن
  if (locale === 'ar') {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return formatted.replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
  }

  // ۴. برای سایر زبان‌ها (انگلیسی، آلمانی و...) همان لاتین می‌ماند
  return formatted;
}

export function formatAddress(address: string | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatLocaleDate(date: Date, locale: string = 'en', options?: Intl.DateTimeFormatOptions): string {
  // برای تاریخ شمسی (fa) و میلادی (en)
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : locale === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options
  }).format(date);
}