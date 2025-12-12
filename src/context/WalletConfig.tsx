// src/context/WalletConfig.tsx

import { cookieStorage, createStorage, http } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { polygonAmoy, mainnet, arbitrum, bsc, sepolia } from '@reown/appkit/networks';

// 1. دریافت Project ID
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "fb230fd05e15e986ed8721e5ebbbf988";

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// 2. تعریف شبکه ها
export const networks = [polygonAmoy, mainnet, arbitrum, bsc, sepolia];

// 3. ایجاد آداپتور Wagmi برای Reown
// نکته: ssr: true بسیار مهم است برای جلوگیری از خطاهای Hydration
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
});

// 4. خروجی کانفیگ برای استفاده در Provider
export const config = wagmiAdapter.wagmiConfig;