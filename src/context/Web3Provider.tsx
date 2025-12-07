// src/context/Web3Provider.tsx - NON-BLOCKING VERSION

'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { WagmiProvider, State, useAccount, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./WalletConfig";

export type UserRole = 'admin' | 'investor' | 'startup' | 'voter' | 'delegate' | null;

export interface IWeb3Context {
    userRole: UserRole;
    isRoleLoading: boolean;
    setUserRole: (role: UserRole) => void;
    address?: Address;
    registryAddress: Address | undefined;
    isHydrated: boolean; 
    daoAddress: Address | undefined;
    tokenAddress: Address | undefined;
    financeAddress: Address | undefined;
    stakingAddress: Address | undefined;
}

const Web3Context = createContext<IWeb3Context | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isRoleLoading, setIsRoleLoading] = useState(true);
    // state برای اینکه مطمئن شویم در کلاینت هستیم
    const [mounted, setMounted] = useState(false);

    const { address, status, isConnected } = useAccount();
    
    const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as Address | undefined;

    useEffect(() => {
        setMounted(true);
    }, []);

    // --- Role Logic ---
    useEffect(() => {
        setIsRoleLoading(true);
        const timer = setTimeout(() => {
            if (status === 'connected' && address) {
                const adminEnvAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
                if (adminEnvAddress && address.toLowerCase() === adminEnvAddress.toLowerCase()) {
                    setUserRole('admin');
                } else {
                    const storedRole = localStorage.getItem(`userRole_${address}`) as UserRole;
                    if (storedRole) setUserRole(storedRole);
                }
            } else if (status === 'disconnected') {
                setUserRole(null);
            }
            setIsRoleLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [status, address]);

    const handleSetUserRole = useCallback((role: UserRole) => {
      setUserRole(role);
      if (role && address) localStorage.setItem(`userRole_${address}`, role);
    }, [address]);

    // --- Contract Addresses (Async Load) ---
    const { data: addressesData, isLoading: areAddressesLoading } = useReadContracts({
        contracts: [
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] },
        ],
        query: { 
            // فقط اگر آدرس رجیستری داریم و کامپوننت مونت شده تلاش کن
            enabled: !!registryAddress && mounted, 
        } 
    });

    const { daoAddress, tokenAddress, financeAddress, stakingAddress } = useMemo(() => {
        if (!addressesData) return { daoAddress: undefined, tokenAddress: undefined, financeAddress: undefined, stakingAddress: undefined };
        const [dao, token, finance, staking] = addressesData.map(d => d.result as Address | undefined);
        return { daoAddress: dao, tokenAddress: token, financeAddress: finance, stakingAddress: staking };
    }, [addressesData]);
    
    // isHydrated وضعیت داده‌ها را نشان می‌دهد، اما دیگر شرط رندر شدن نیست
    const isHydrated = !areAddressesLoading && mounted;

    const value: IWeb3Context = {
        userRole,
        isRoleLoading,
        setUserRole: handleSetUserRole,
        address,
        registryAddress,
        isHydrated,
        daoAddress,
        tokenAddress,
        financeAddress,
        stakingAddress,
    };

    // حالا حتی اگر داده‌ها هنوز در حال لود شدن باشند، {children} (یعنی صفحه لندینگ) رندر می‌شود.
    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (context === undefined) {
        return {} as IWeb3Context;
    }
    return context;
}