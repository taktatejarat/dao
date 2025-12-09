// src/app/layout.tsx

import '@/lib/polyfill';
import type { Metadata } from 'next';
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { wagmiConfig } from "@/context/WalletConfig";
import { Web3Provider } from "@/context/Web3Provider";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageProvider";
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { ClientRoot } from '@/components/layout/client-root';
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

// فونت‌ها طبق فایل خودتان
const fontSans = localFont({
  src: [
    { path: './fonts/Roboto-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Roboto-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const fontHeadline = localFont({
  src: [
    { path: './fonts/Roboto-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-headline',
  display: 'swap',
});

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
  title: 'NextN DAO-VC',
  description: 'AI-Powered Decentralized Investment Protocol',
};

// ✅ اضافه شدن async برای Next.js 16
export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const direction = (locale === 'fa' || locale === 'ar') ? 'rtl' : 'ltr';
  
  // ✅ دریافت کوکی‌ها و بازسازی وضعیت Wagmi
  const headersList = await headers();
  const context = headersList.get('cookie');
  const initialState = cookieToInitialState(wagmiConfig, context);

  return (
    <html lang={locale || 'en'} dir={direction} suppressHydrationWarning>
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable, 
          fontHeadline.variable,
          fontVazir.variable
        )}
      >
        <Web3Provider initialState={initialState}>
            <UserProvider>
                <LanguageProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <ClientRoot>
                            {children}
                        </ClientRoot>
                    </ThemeProvider>
                </LanguageProvider>
            </UserProvider>
        </Web3Provider>
      </body>
    </html>
  );
}