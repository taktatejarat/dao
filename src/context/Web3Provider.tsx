// src/context/Web3Provider.tsx - FINAL, CORRECTED, AND DEBUG-ENABLED

'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';

export type UserRole = 'admin' | 'investor' | 'startup' | 'voter' | 'delegate' | null;

export interface IWeb3Context {
    userRole: UserRole;
    isRoleLoading: boolean;
    setUserRole: (role: UserRole) => void;
    address?: Address;
    registryAddress: Address | undefined;
    isHydrated: boolean;
    // افزودن آدرس‌های جدید به اینترفیس
    tokenAddress: Address | undefined;
    stakingAddress: Address | undefined;
    daoAddress: Address | undefined; // ✅ آدرس DAO را هم اضافه می‌کنیم
}

const Web3Context = createContext<IWeb3Context | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isRoleLoading, setIsRoleLoading] = useState(true);
    const { address, status } = useAccount();
    const [isHydrated, setIsHydrated] = useState(false);

    // ✅✅✅ FIX 1: خواندن آدرس رجیستری مستقیماً از .env ✅✅✅
    // این منبع حقیقت اصلی ماست.
    const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as Address | undefined;

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // --- منطق مدیریت نقش کاربر (بدون تغییر) ---
    useEffect(() => {
        setIsRoleLoading(true);
        
        // Add a small delay to allow users to see setup page before redirect
        const timer = setTimeout(() => {
            if (status === 'connected' && address) {
                // آدرس ادمین از متغیرهای محیطی خوانده می‌شود
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
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [status, address]);

  // ✅✅✅ FIX 2: خواندن دقیق و صحیح هر آدرس به صورت جداگانه از رجیستری ✅✅✅
    const { data: tokenAddressResult } = useReadContract({
        address: registryAddress,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.TOKEN],
        query: { enabled: !!registryAddress && isHydrated }, // فقط زمانی اجرا شود که hydrated شده باشد
    });
    const tokenAddress = tokenAddressResult as Address | undefined;

    const { data: stakingAddressResult } = useReadContract({
        address: registryAddress,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.STAKING],
        query: { enabled: !!registryAddress && isHydrated },
    });
    const stakingAddress = stakingAddressResult as Address | undefined;

    const { data: daoAddressResult } = useReadContract({
        address: registryAddress,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.DAO],
        query: { enabled: !!registryAddress && isHydrated },
    });
    const daoAddress = daoAddressResult as Address | undefined;


    // ✅✅✅ DEBUGGING LOG (درخواستی شما) ✅✅✅
    useEffect(() => {
        if (isHydrated) {
            console.log("--- [Web3Provider] Contract Addresses Initialized ---");
            console.log("Registry Address (from .env):", registryAddress);
            console.log("DAO Address (read from Registry):", daoAddress);
            console.log("Staking Address (read from Registry):", stakingAddress);
            console.log("Token Address (read from Registry):", tokenAddress);
            console.log("----------------------------------------------------");
        }
    }, [isHydrated, registryAddress, daoAddress, stakingAddress, tokenAddress]); // اجرا با تغییر هر یک از آدرس‌ها

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

    const value: IWeb3Context = {
        userRole,
        isRoleLoading,
        setUserRole: handleSetUserRole,
        address,
        registryAddress,
        isHydrated,
        tokenAddress,
        stakingAddress,
        daoAddress,
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error("useWeb3 must be used within a Web3Provider");
    }
    return context;
}