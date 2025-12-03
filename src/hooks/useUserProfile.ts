// src/hooks/useUserProfile.ts

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/context/Web3Provider';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { rayanChainTokenAbi, daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { toast } from 'sonner';
import { type Address } from 'viem';

export type UserProfileData = {
    displayName: string;
    email: string;
};

export type NotificationSettings = {
    proposal: boolean;
    result: boolean;
    summary: boolean;
};

export function useUserProfile() {
    const { address, isHydrated, registryAddress } = useWeb3();
    
    // States
    const [profile, setProfile] = useState<UserProfileData>({ displayName: '', email: '' });
    const [notifications, setNotifications] = useState<NotificationSettings>({ proposal: true, result: true, summary: false });
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Token Address from Registry
    const { data: tokenAddress } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.TOKEN],
        query: { enabled: !!registryAddress && isHydrated }
    });

    // 2. Balances
    const { data: nativeBalance, isLoading: isNativeLoading } = useBalance({ address: address || undefined });
    
    const { data: rycBalance, isLoading: isRycLoading } = useReadContract({
        address: tokenAddress,
        abi: rayanChainTokenAbi,
        functionName: 'balanceOf',
        args: [address!],
        query: { enabled: !!address && !!tokenAddress },
    });

    // 3. Fetch Profile API
    useEffect(() => {
        async function fetchProfile() {
            if (!address) return;
            setIsLoadingProfile(true);
            try {
                const response = await fetch(`/api/profile?address=${address}`);
                if (response.ok) {
                    const data = await response.json();
                    setProfile(data);
                    // اینجا می‌توان نوتیفیکیشن‌ها را هم از دیتابیس خواند
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoadingProfile(false);
            }
        }
        if (isHydrated) fetchProfile();
    }, [address, isHydrated]);

    // 4. Save Actions
    const updateProfile = useCallback(async (newData: UserProfileData) => {
        if (!address) return;
        setIsSaving(true);
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, ...newData }),
            });
            if (response.ok) {
                setProfile(newData);
                toast.success("Profile updated successfully"); // بهتر است از ترجمه در کامپوننت استفاده شود
                return true;
            }
            throw new Error('Failed');
        } catch (error) {
            toast.error("Failed to update profile");
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [address]);

    return {
        profile,
        setProfile,
        notifications,
        setNotifications,
        balances: {
            native: nativeBalance,
            ryc: rycBalance as bigint | undefined,
        },
        isLoading: isLoadingProfile || isNativeLoading || isRycLoading,
        isSaving,
        updateProfile
    };
}