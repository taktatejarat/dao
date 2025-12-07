// src/context/WalletConfig.tsx

"use client";

import { http, createConfig } from 'wagmi';
import { polygonAmoy, sepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "fb230fd05e15e986ed8721e5ebbbf988";


export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
  connectors: [
    injected({ target: 'metaMask' }), 
    
    // ✅ اصلاح تنظیمات WalletConnect
    walletConnect({ 
        projectId, 
        showQrModal: true,
        // اضافه کردن متادیتای دقیق برای جلوگیری از خطای Verify
        metadata: {
            name: 'RayanChain DAO',
            description: 'DAO VC Platform',
            url: 'https://daovc.net', // یک آدرس واقعی یا ساختگی 
            icons: ['https://avatars.githubusercontent.com/u/37784886']
        },
    }), 
    
    coinbaseWallet({ appName: 'RayanChain DAO' }),
  ],
  ssr: true,
});