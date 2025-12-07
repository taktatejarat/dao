// src/context/Providers.tsx - FINAL (No RainbowKit)

'use client';

import { ThemeProvider } from 'next-themes';
import { type ReactNode, useState } from 'react';
import { Toaster } from 'sonner';
import { LanguageProvider, useLanguage } from './LanguageProvider';
import dynamic from 'next/dynamic';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { wagmiConfig } from './WalletConfig'; // پسوند .tsx لازم نیست
import { Web3Provider } from './Web3Provider';
import { AuthGuard } from '@/components/auth/auth-guard';

function Web3Bundle({ children }: { children: ReactNode }) {
    // ایجاد queryClient داخل کامپوننت (بهترین روش برای React 19)
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, 
                refetchOnWindowFocus: false,
            },
        },
    }));

    if (!wagmiConfig) {
        return <div className="flex justify-center p-10"><DaoLoadingSpinner /></div>;
    }

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <Web3Provider>
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </Web3Provider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

const DynamicWeb3Bundle = dynamic(
    () => Promise.resolve(Web3Bundle),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <DaoLoadingSpinner className="w-16 h-16" />
            </div>
        ),
    }
);

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <Toaster position="top-right" richColors closeButton />
            <LanguageProvider>
                <DynamicWeb3Bundle>
                    {children}
                </DynamicWeb3Bundle>
            </LanguageProvider>
        </ThemeProvider>
    );
}