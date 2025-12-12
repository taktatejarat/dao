// src/context/Providers.tsx - CLEANED & OPTIMIZED

'use client';

import { ThemeProvider } from 'next-themes';
import { type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { LanguageProvider } from './LanguageProvider';
import { Web3Provider } from './Web3Provider';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AppKitProvider } from './AppKitProvider';
import dynamic from 'next/dynamic';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';

// لود کردن Web3Provider به صورت کلاینت ساید برای اطمینان بیشتر
// (هرچند با AppKitProvider جدید، SSR هم پشتیبانی می‌شود ولی برای کامپوننت‌های داخلی امن‌تر است)
const ClientWeb3Wrapper = dynamic(
    () => Promise.resolve(({ children }: { children: ReactNode }) => (
        <Web3Provider>
            <AuthGuard>
                {children}
            </AuthGuard>
        </Web3Provider>
    )),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <DaoLoadingSpinner className="w-16 h-16" />
                <span className="mt-4 text-muted-foreground text-sm animate-pulse">Initializing DAO...</span>
            </div>
        ),
    }
);

export function Providers({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <Toaster position="top-right" richColors closeButton />
            
            <LanguageProvider>
                {/* AppKitProvider مسئول Wagmi و QueryClient است */}
                <AppKitProvider cookies={cookies}>
                    <ClientWeb3Wrapper>
                        {children}
                    </ClientWeb3Wrapper>
                </AppKitProvider>
            </LanguageProvider>
            
        </ThemeProvider>
    );
}