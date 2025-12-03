// src/hooks/useAdminDashboard.ts

import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { rayanChainDaoAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { useDashboardStats } from './useDashboardStats';
import { type Address } from 'viem';

export function useAdminDashboard() {
    const { isConnected } = useAccount();
    const { addresses, isLoading: isGlobalLoading } = useDashboardStats();

    const { data: adminData, isLoading: isAdminLoading } = useReadContracts({
        contracts: [
            // Index 0: مالک سیستم
            { address: addresses.dao, abi: rayanChainDaoAbi, functionName: 'owner' },
            
            // Index 1: موجودی خزانه (قبلاً ایندکس ۲ بود)
            { address: addresses.token, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [addresses.finance!] },
            
            // Index 2: تعداد پروپوزال‌ها (قبلاً ایندکس ۳ بود)
            { address: addresses.dao, abi: rayanChainDaoAbi, functionName: 'nextProposalId' },
            
            // نکته: هر وقت تابع paused را اضافه کردید، آن را به انتهای آرایه اضافه کنید تا ترتیب به هم نریزد
        ],
        query: { 
            enabled: isConnected && !isGlobalLoading && !!addresses.dao,
            refetchInterval: 10000 
        }
    });

    const stats = useMemo(() => {
        if (!adminData) return null;
        
        // ✅ اصلاح ایندکس‌ها:
        const owner = adminData[0].result as Address;
        const treasuryBalance = adminData[1].result as bigint ?? 0n; // ایندکس اصلاح شد
        const nextProposalId = adminData[2].result as bigint ?? 0n; // ایندکس اصلاح شد

        return {
            owner,
            isPaused: false, // مقدار پیش‌فرض تا زمان پیاده‌سازی قرارداد
            treasuryBalance,
            totalProposals: Number(nextProposalId) > 0 ? Number(nextProposalId) - 1 : 0
        };
    }, [adminData]);

    return {
        stats,
        isLoading: isGlobalLoading || isAdminLoading
    };
}