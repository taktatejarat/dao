// src/app/layout.tsx - FONT OPTIMIZATION

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/context/Providers';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { ClientRoot } from '@/components/layout/client-root';
import { AuthGuard } from '@/components/auth/auth-guard';

// 1. فونت اصلی متن (لاتین) - پیشنهاد: Roboto یا Inter
// اگر فایل‌ها را ندارید، نام فایل‌های موجود خودتان را بگذارید
const fontSans = localFont({
  src: [
    { path: './fonts/Roboto-Regular.ttf', weight: '400', style: 'normal' }, // مسیر فرضی
    { path: './fonts/Roboto-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

// 2. فونت تیترها (لاتین) - پیشنهاد: حذف Merienda و استفاده از Sans یا فونتی مثل "Montserrat"
// اگر می‌خواهید Merienda را حذف کنید، کافیست متغیر آن را به همان فونت Sans ارجاع دهید
const fontHeadline = localFont({
  src: [
    { path: './fonts/Roboto-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-headline',
  display: 'swap',
});

// 3. فونت فارسی (بدون تغییر)
const fontVazir = localFont({
  src: [
    { path: './fonts/Vazirmatn-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Vazirmatn-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/Vazirmatn-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-vazir',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RayanChain DAO',
  description: 'AI-Powered Decentralized Investment Protocol',
};

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // تشخیص جهت (اینجا فقط برای HTML اولیه است، ClientRoot آن را مدیریت می‌کند)
  const direction = (locale === 'fa' || locale === 'ar') ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable, 
          fontHeadline.variable,
          fontVazir.variable
        )}
      >
        <Providers>
          <ClientRoot>
            <AuthGuard>
              {children}
            </AuthGuard>
          </ClientRoot>
        </Providers>
      </body>
    </html>
  );
}