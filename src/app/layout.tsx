// src/app/layout.tsx

import '@/lib/polyfill'; 
import type { Metadata } from 'next';
import { headers } from "next/headers";
import { AppKitProvider } from '@/context/AppKitProvider'; 
import { Web3Provider } from "@/context/Web3Provider";
import { UserProvider } from "@/context/UserContext"; 
import { LanguageProvider } from "@/context/LanguageProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { ClientRoot } from '@/components/layout/client-root';
import { Toaster } from "sonner";
import "./globals.css";

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

// فونت وزیرمتن برای فارسی
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
  title: 'RayanChain DAOVC',
  description: 'AI-Powered Decentralized Investment Protocol',
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === 'fa' || locale === 'ar';
  const direction = isRtl ? 'rtl' : 'ltr';
  
  const headersList = await headers();
  const cookies = headersList.get('cookie');

  return (
    <html lang={locale || 'en'} dir={direction} suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background antialiased",fontSans.variable, fontHeadline.variable, fontVazir.variable, isRtl ? "font-vazir" : "font-sans" )}>
        <LanguageProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <Toaster position="top-center" richColors closeButton dir={direction} toastOptions={{style: { fontFamily: isRtl ? 'var(--font-vazir)' : 'var(--font-sans)' }}}/>
                <AppKitProvider cookies={cookies}>
                    <Web3Provider>
                        <UserProvider>
                            <ClientRoot>
                                {children}
                            </ClientRoot>
                        </UserProvider>
                    </Web3Provider>
                </AppKitProvider>
            </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}