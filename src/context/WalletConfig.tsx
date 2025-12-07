// src/context/WalletConfig.tsx

"use client";

import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { polygonAmoy,arbitrum,mainnet,bsc,sepolia } from 'wagmi/chains';
import { walletConnect, coinbaseWallet, metaMask, safe } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "fb230fd05e15e986ed8721e5ebbbf988";

export const wagmiConfig = createConfig({
    chains: [polygonAmoy, arbitrum, mainnet, bsc, sepolia], 
    transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_AMOY_RPC),
    [arbitrum.id]: http(),
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
  },
  // ترتیب مهم است: اول متامسک، بعد والت کانکت (برای موبایل)، بعد کوین‌بیس و سیف
  connectors: [
    metaMask(), // نسخه اختصاصی و پایدار
    walletConnect({ 
        projectId, 
        showQrModal: true, // نمایش مودال QR کد برای موبایل‌ها
        metadata: {
            name: 'RayanChain DAO',
            description: 'DAO VC Platform',
            url: 'https://daovc.net', 
            icons: ['https://avatars.githubusercontent.com/u/37784886']
        },
    }), 
    coinbaseWallet({ appName: 'RayanChain DAO' }),
    safe(), // برای کیف پول‌های چند امضایی Gnosis Safe (مناسب DAO)
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
});