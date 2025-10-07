// src/context/Web3Provider.tsx

'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';

export type UserRole = 'admin' | 'investor' | 'startup' | 'voter' | null;

export interface IWeb3Context {
    userRole: UserRole;
    isRoleLoading: boolean;
    setUserRole: (role: UserRole) => void;
    address?: Address;
    registryAddress: Address | undefined;
    setRegistryAddress: (address: Address | undefined) => void;
    isHydrated: boolean;
}

const Web3Context = createContext<IWeb3Context | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isRoleLoading, setIsRoleLoading] = useState(true);
    const { address, status } = useAccount();

    const [registryAddress, setRegistryAddressState] = useState<Address | undefined>(undefined);

    const setRegistryAddress = useCallback((newAddress: Address | undefined) => {
        setRegistryAddressState(newAddress);
        if (typeof window !== 'undefined') {
            if (newAddress) {
                localStorage.setItem('registryAddress', newAddress);
            } else {
                localStorage.removeItem('registryAddress');
            }
            window.dispatchEvent(new Event('storage'));
        }
    }, []);

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

    // 6. به‌روزرسانی مقداری که به Context پاس داده می‌شود
    const value: IWeb3Context = {
        userRole,
        isRoleLoading,
        setUserRole: handleSetUserRole,
        address,
        registryAddress, // پاس دادن آدرس رجیستری
        setRegistryAddress, // پاس دادن تابع setter
        isHydrated,
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
    const context = useContext(Web3Context);
    // ✅ به‌روزرسانی بررسی context برای undefined
    if (context === undefined) {
        throw new Error("useWeb3 must be used within a Web3Provider");
    }
    return context;
}