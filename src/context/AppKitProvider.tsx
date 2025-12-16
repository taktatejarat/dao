// src/context/AppKitProvider.tsx

'use client'

import React, { type ReactNode, useState, useEffect } from 'react'
import { wagmiAdapter, projectId, networks } from '@/context/WalletConfig'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit, useAppKitTheme } from '@reown/appkit/react' // ✅ اضافه شدن useAppKitTheme
import { polygonAmoy } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { useTheme } from 'next-themes' // ✅ اضافه شدن useTheme

// متادیتا برای نمایش در ولت کاربر
const metadata = {
  name: 'RayanChain DAOVC',
  description: 'Decentralized VC Platform',
  url: 'https://nextn.dao', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}


// Double Casting
const typedNetworks = networks as unknown as [AppKitNetwork, ...AppKitNetwork[]];

// ✅ FIX: تابع createAppKit باید بدون شرط اجرا شود تا در SSR هم در دسترس باشد.
// کتابخانه Reown خودش بررسی‌های لازم برای window را انجام می‌دهد.
createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: typedNetworks,
    defaultNetwork: polygonAmoy,
    metadata: metadata,
    features: {
        analytics: false,
        email: false, 
        socials: []   
    },
})

export function AppKitProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);
  const { resolvedTheme } = useTheme();
  const { setThemeMode } = useAppKitTheme();

  // Sync Theme
  useEffect(() => {
    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      setThemeMode(resolvedTheme);
    }
  }, [resolvedTheme, setThemeMode]);

  // Stable Query Client
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1, 
        },
    },
  }));

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}