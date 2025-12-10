// src/context/AppKitProvider.tsx

'use client'

import { wagmiAdapter, projectId } from '@/context/WalletConfig'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { polygonAmoy, mainnet, arbitrum, bsc, sepolia } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// ✅ تعریف متادیتا برای حل مشکل Coinbase و نمایش درست در موبایل
const metadata = {
  name: 'NextN DAO',
  description: 'Decentralized VC Platform',
  url: 'https://nextn.dao', // آدرس باید معتبر به نظر برسد
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// ✅ ایجاد مودال در فضای سراسری (بیرون کامپوننت)
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [polygonAmoy, mainnet, arbitrum, bsc, sepolia],
  defaultNetwork: polygonAmoy,
  metadata: metadata,
  features: {
    analytics: true,
    email: false, // ایمیل را فعلا خاموش می‌کنیم
    socials: []   // ورود با گوگل/توییتر را خاموش می‌کنیم
  },
  themeMode: 'dark'
})

export function AppKitProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  // تبدیل کوکی به وضعیت اولیه برای SSR
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}