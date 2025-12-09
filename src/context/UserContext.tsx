// src/context/UserContext.tsx

"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { useWeb3, UserRole } from './Web3Provider'; // ✅ دسترسی به Web3Provider

interface UserProfile {
    walletAddress: string;
    roles: string[];
    kycStatus: string;
}

interface UserContextType {
    user: UserProfile | null;
    isLoading: boolean;
    isStartup: boolean;
    isAdmin: boolean;
    refreshProfile: () => void;
}

const UserContext = createContext<UserContextType>({} as any);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { address, isConnected } = useAccount();
    const { setUserRole } = useWeb3(); // ✅ تابع ست کردن نقش در سایدبار
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // تابع فچ کردن اطلاعات کاربر از دیتابیس
    const fetchUser = async (addr: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addr })
            });
            const data = await res.json();
            
            if (data.success && data.user) {
                setUser(data.user);
                
                // ✅ همگام‌سازی با Web3Provider برای سایدبار
                const roles = data.user.roles || [];
                let primaryRole: UserRole = 'voter'; // پیش‌فرض
                
                if (roles.includes('admin')) primaryRole = 'admin';
                else if (roles.includes('startup')) primaryRole = 'startup';
                else if (roles.includes('investor')) primaryRole = 'investor';
                
                setUserRole(primaryRole);
            }
        } catch (e) {
            console.error("Auth Error", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected && address) {
            fetchUser(address);
        } else {
            setUser(null);
            setUserRole(null); // ریست کردن نقش در صورت قطع اتصال
        }
    }, [isConnected, address]);

    const isStartup = user?.roles.includes('startup') || false;
    const isAdmin = user?.roles.includes('admin') || false;

    return (
        <UserContext.Provider value={{ 
            user, 
            isLoading, 
            isStartup, 
            isAdmin,
            refreshProfile: () => address && fetchUser(address) 
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);