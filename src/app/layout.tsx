
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/context/Providers';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { ClientRoot } from '@/components/layout/client-root';

// فونت Exo 2 برای بدنه متن انگلیسی
const fontSans = localFont({
  src: '../fonts/Exo2-VariableFont_wght.ttf',
  display: 'swap',
  variable: '--font-sans', // ✅ متغیر برای بدنه متن
});

// فونت Merienda برای سرفصل‌های انگلیسی
const fontHeadline = localFont({
  src: '../fonts/Merienda-VariableFont_wght.ttf',
  display: 'swap',
  variable: '--font-headline', // ✅ متغیر برای سرفصل‌ها
});

// فونت وزیرمتن برای زبان فارسی
const fontVazir = localFont({
  src: [
    { path: '../fonts/Vazirmatn-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Vazirmatn-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-vazir', // ✅ متغیر برای زبان فارسی
});

export const metadata: Metadata = {
  title: 'RayanChain DAO Platform',
  description: 'Decentralized Autonomous Organization Platform for funding new startups.',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable, 
          fontHeadline.variable,
          fontVazir.variable
        )}
      >
        <Providers>
          <ClientRoot>{children}</ClientRoot>
        </Providers>
      </body>
    </html>
  );
}