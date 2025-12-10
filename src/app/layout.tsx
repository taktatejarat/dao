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

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const direction = (locale === 'fa' || locale === 'ar') ? 'rtl' : 'ltr';
  const headersList = await headers();
  const cookies = headersList.get('cookie');

  return (
    <html lang={locale || 'en'} dir={direction} suppressHydrationWarning>
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable, 
          fontHeadline.variable,
          fontVazir.variable
        )}
      >
        {/* ✅ استفاده از AppKitProvider به عنوان لایه اصلی اتصال */}
        <AppKitProvider cookies={cookies}>
            <Web3Provider>
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
        </AppKitProvider>
      </body>
    </html>
  );
}