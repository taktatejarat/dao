// src/context/WalletConfig.tsx - FORCED HTTP TRANSPORT

import { cookieStorage, createStorage, http } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { polygonAmoy, mainnet, arbitrum, bsc, sepolia } from '@reown/appkit/networks';

// دریافت Project ID
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "fb230fd05e15e986ed8721e5ebbbf988";

if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const networks = [polygonAmoy, mainnet, arbitrum, bsc, sepolia];

// ✅ FIX: تعریف Transports برای جلوگیری از خطای WebSocket Upgrade
// ما به جای wss از http استفاده می‌کنیم که پایدارتر است.
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [polygonAmoy.id]: http(), // Force HTTP
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
  }
});

export const config = wagmiAdapter.wagmiConfig;