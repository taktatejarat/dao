"use client";

import {
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { sepolia, polygonAmoy } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "c8e76c15a521396a5559139d155fad35";
const appName = 'RayanChain DAO';

// Create config function that only runs on client side
function createWagmiConfig() {
  if (typeof window === 'undefined') {
    // در سمت سرور، یک کانفیگ "ساختگی" اما معتبر برمی‌گردانیم تا از خطا جلوگیری شود
    // این کانفیگ هرگز عملاً استفاده نخواهد شد.
    return createConfig({
      chains: [polygonAmoy],
      transports: { [polygonAmoy.id]: http() },
    });
  }

  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Suggested',
        wallets: [
            injectedWallet,
            metaMaskWallet,
            coinbaseWallet,
        ],
      },
    ],
    { appName, projectId }
  );

  return createConfig({
    connectors,
    chains: [sepolia, polygonAmoy],
    transports: {
      [sepolia.id]: http(),
      [polygonAmoy.id]: http(),
    },
    // این کار مکانیزم فیلتر ناپایدار را با یک Polling پایدار جایگزین می‌کند.
    multiInjectedProviderDiscovery: false,
  });
}

// ✅ ما کانفیگ را یک بار ایجاد و export می‌کنیم
const wagmiConfig = createWagmiConfig();

// ما به جای export کردن متغیر، نوع آن را export می‌کنیم
export { wagmiConfig };