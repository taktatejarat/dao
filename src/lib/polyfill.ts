// src/lib/polyfill.ts

"use client";

// در محیط‌های مدرن Next.js و Wagmi v2/v3 نیازی به Mock کردن کامل indexedDB نیست.
// این فایل صرفاً برای جلوگیری از کرش‌های احتمالی قدیمی نگه‌داشته شده اما منطق مخرب آن حذف شده است.

if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // تعریف حداقل‌های لازم برای جلوگیری از خطاهای احتمالی برخی کتابخانه‌های قدیمی
    // @ts-ignore
    if (!global.window) {
        // @ts-ignore
        global.window = global;
    }
}

export {};