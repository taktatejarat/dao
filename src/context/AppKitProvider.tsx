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

// این کار خطای "may be a mistake" را برطرف می‌کند چون به کامپایلر می‌گوییم ما از ساختار داده مطمئن هستیم.
const typedNetworks = networks as unknown as [AppKitNetwork, ...AppKitNetwork[]];

// ایجاد نمونه AppKit
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

  // 1. دریافت تم فعلی از Next-Themes
  const { resolvedTheme } = useTheme();
  // 2. دریافت تابع تغییر تم از Reown
  const { setThemeMode } = useAppKitTheme();

  // 3. همگام‌سازی تم‌ها
  useEffect(() => {
    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      setThemeMode(resolvedTheme);
    }
  }, [resolvedTheme, setThemeMode]);

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
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