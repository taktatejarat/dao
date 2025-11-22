// src/context/Web3Provider.tsx - FINAL, CLEANED, AND NO REDECLARATION ERRORS

'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner'; // ✅ ایمپورت برای حالت لودینگ

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
    const { address, status, isConnected } = useAccount();
    
    const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as Address | undefined;

    // --- ✅✅✅ SECTION 1: منطق مدیریت نقش کاربر (بازگردانده شد) ✅✅✅ ---
    useEffect(() => {
        setIsRoleLoading(true);
        
        const timer = setTimeout(() => {
            if (status === 'connected' && address) {
                const adminEnvAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
                if (adminEnvAddress && address.toLowerCase() === adminEnvAddress.toLowerCase()) {
                    setUserRole('admin');
                } else {
                    const storedRole = localStorage.getItem(`userRole_${address}`) as UserRole;
                    if (storedRole) {
                        setUserRole(storedRole);
                    }
                }
            } else if (status === 'disconnected') {
                setUserRole(null);
            }
            setIsRoleLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [status, address]);

    const handleSetUserRole = useCallback((role: UserRole) => {
      const adminEnvAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
      if (address && adminEnvAddress && address.toLowerCase() === adminEnvAddress.toLowerCase()) {
          setUserRole('admin');
          return;
      }
      
      setUserRole(role);
      if (role && status === 'connected' && address) {
        localStorage.setItem(`userRole_${address}`, role);
      } else if (address) {
        localStorage.removeItem(`userRole_${address}`);
      }
    }, [address, status]);
    // --- پایان منطق مدیریت نقش کاربر ---

    // ✅✅✅ بخش خواندن آدرس‌ها (فقط از useReadContracts) ✅✅✅
    const { data: addressesData, isLoading: areAddressesLoading, isSuccess: areAddressesLoaded } = useReadContracts({
        contracts: [
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] },
        ],
        query: { enabled: !!registryAddress }
    });

    const { daoAddress, tokenAddress, financeAddress, stakingAddress } = useMemo(() => {
        if (!addressesData) return {};
        const [dao, token, finance, staking] = addressesData.map(d => d.result as Address | undefined);
        return { daoAddress: dao, tokenAddress: token, financeAddress: finance, stakingAddress: staking };
    }, [addressesData]);
    
    const isHydrated = isConnected && areAddressesLoaded;

    // --- DEBUGGING LOG (بدون تغییر) ---
    useEffect(() => {
        if (areAddressesLoaded) {
            console.log("--- [Web3Provider] Contract Addresses Initialized ---");
            console.log("Registry Address (from .env):", registryAddress);
            console.log("DAO Address (read from Registry):", daoAddress);
            console.log("Staking Address (read from Registry):", stakingAddress);
            console.log("Token Address (read from Registry):", tokenAddress);
            console.log("Finance Address (read from Registry):", financeAddress);
            console.log("----------------------------------------------------");
        }
    }, [areAddressesLoaded, registryAddress, daoAddress, stakingAddress, tokenAddress, financeAddress]);

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

    // حالت لودینگ مرکزی
    if (areAddressesLoading && isConnected) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <DaoLoadingSpinner className="h-12 w-12" />
            </div>
        );
    }

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error("useWeb3 must be used within a Web3Provider");
    }
    return context;
}