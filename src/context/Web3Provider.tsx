// src/context/Web3Provider.tsx

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
    setRegistryAddress: (address: Address | undefined) => void;
    isHydrated: boolean;
    // ✅✅✅ FIX 1: افزودن آدرس‌های جدید به اینترفیس ✅✅✅
    tokenAddress: Address | undefined;
    stakingAddress: Address | undefined;
}

const Web3Context = createContext<IWeb3Context | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isRoleLoading, setIsRoleLoading] = useState(true);
    const { address, status } = useAccount();
    const [registryAddress, setRegistryAddressState] = useState<Address | undefined>(undefined);
    const [isHydrated, setIsHydrated] = useState(false);

    // این useEffect مسئول خواندن اولیه و گوش دادن به تغییرات است
    useEffect(() => {
        const syncAddress = () => {
            // به عنوان اولویت اول، همیشه از localStorage بخوان
            const storedRegistryAddr = localStorage.getItem('registryAddress') as Address | undefined;
            setRegistryAddressState(storedRegistryAddr);
        };

        syncAddress(); // خواندن در اولین بارگذاری
        setIsHydrated(true);

        // به رویداد storage (چه از تب دیگر و چه از رویداد سفارشی خودمان) گوش بده
        window.addEventListener('storage', syncAddress);
        return () => window.removeEventListener('storage', syncAddress);
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

    // ✅✅✅ FIX 2: خواندن آدرس‌های Token و Staking از رجیستری ✅✅✅
    const { data: tokenAddressResult } = useReadContract({
        address: registryAddress,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.TOKEN],
        query: { enabled: !!registryAddress },
    });
    const tokenAddress = tokenAddressResult as Address | undefined;

    const { data: stakingAddressResult } = useReadContract({
        address: registryAddress,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.STAKING],
        query: { enabled: !!registryAddress },
    });
    const stakingAddress = stakingAddressResult as Address | undefined;

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
        setUserRole: () => {}, // placeholder
        address,
        registryAddress,
        setRegistryAddress: () => {}, // placeholder
        isHydrated,
        // ✅✅✅ FIX 3: قرار دادن آدرس‌های جدید در context value ✅✅✅
        tokenAddress,
        stakingAddress,
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