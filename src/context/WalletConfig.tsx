// src/context/WalletConfig.tsx

"use client";

import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { polygonAmoy,arbitrum,mainnet,bsc,sepolia } from 'wagmi/chains';
import { walletConnect, coinbaseWallet, metaMask, safe } from 'wagmi/connectors';


const appMetadata  = {
  name: 'RayanChain DAO',
  description: 'DAO VC Platform',
  url: 'https://daovc.net',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};
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
    metaMask(), // متامسک معمولا خودش متادیتا را از سایت می‌خواند
    walletConnect({ 
        projectId, 
        showQrModal: true, 
        metadata: appMetadata // ✅ تزریق متادیتا
    }), 
    coinbaseWallet({ 
        appName: appMetadata.name, // ✅ نام اجباری
        appLogoUrl: appMetadata.icons[0] // ✅ لوگو اجباری
    }),
    safe(), 
  ],
  // ✅ تنظیمات حیاتی برای جلوگیری از خطای سرور
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
});