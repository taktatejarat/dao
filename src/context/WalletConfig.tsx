// src/context/WalletConfig.tsx

"use client";

import '@/lib/polyfill'; 
import { cookieStorage, createStorage } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { polygonAmoy, arbitrum, mainnet, bsc, sepolia } from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "fb230fd05e15e986ed8721e5ebbbf988";

if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const networks = [polygonAmoy, mainnet, arbitrum, bsc, sepolia];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
});

export const config = wagmiAdapter.wagmiConfig;