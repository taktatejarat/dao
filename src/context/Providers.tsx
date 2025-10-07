'use client';

import { ThemeProvider } from 'next-themes';
import { type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { LanguageProvider, useLanguage } from './LanguageProvider';
import dynamic from 'next/dynamic';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';

// All Web3 related providers are wrapped in this component.
// We will then load THIS component dynamically.
// This prevents ANY of its children from being bundled on the server.
import { RainbowKitProvider, darkTheme, lightTheme, type Locale as RainbowLocale } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { wagmiConfig } from './WalletConfig.tsx'; // ✅ Using the correct .tsx extension
import { Web3Provider } from './Web3Provider'; // ✅ Using your existing, complete Web3Provider
import { AuthGuard } from '@/components/auth/auth-guard';

const queryClient = new QueryClient();

// This component will ONLY ever be rendered on the client.
function Web3Bundle({ children }: { children: ReactNode }) {
    const { locale } = useLanguage();

    // Don't render if wagmiConfig is not ready
    if (!wagmiConfig) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <DaoLoadingSpinner className="w-16 h-16" />
                <p className="text-muted-foreground mt-4">Loading Web3...</p>
            </div>
        );
    }

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    locale={locale as RainbowLocale}
                    theme={{
                        lightMode: lightTheme({ borderRadius: 'large', accentColor: 'hsl(var(--primary))', accentColorForeground: 'hsl(var(--primary-foreground))' }),
                        darkMode: darkTheme({ borderRadius: 'large', accentColor: 'hsl(var(--primary))', accentColorForeground: 'hsl(var(--primary-foreground))' })
                    }}
                >
                    {/* Your complete, existing Web3Provider is used here */}
                    <Web3Provider>
                        <AuthGuard>
                            {children}
                        </AuthGuard>
                    </Web3Provider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

// ✅✅✅ راه‌حل کلیدی: بارگذاری داینامیک کامپوننت تعریف شده در همین فایل ✅✅✅
const DynamicWeb3Bundle = dynamic(
    () => Promise.resolve(Web3Bundle), // This trick loads a component from the same file
    {
        ssr: false, // This is the most important part: completely disables Server-Side Rendering
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
                {/* We render the dynamically loaded bundle here */}
                <DynamicWeb3Bundle>
                    {children}
                </DynamicWeb3Bundle>
            </LanguageProvider>
        </ThemeProvider>
    );
}