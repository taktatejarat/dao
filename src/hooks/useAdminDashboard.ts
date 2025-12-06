// src/hooks/useAdminDashboard.ts - FINAL FIXED VERSION

import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { rayanChainDaoAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { useDashboardStats } from './useDashboardStats';
import { type Address, formatEther } from 'viem';

export function useAdminDashboard() {
    const { isConnected } = useAccount();
    const { addresses, isLoading: isGlobalLoading } = useDashboardStats();

    const { data: adminData, isLoading: isAdminLoading, refetch, error } = useReadContracts({
        contracts: [
            // 0. دریافت آدرس مالک (Owner)
            { 
                address: addresses.dao, 
                abi: rayanChainDaoAbi, 
                functionName: 'owner' 
            },
            
            // 1. دریافت موجودی خزانه (Balance)
            { 
                address: addresses.token, 
                abi: rayanChainTokenAbi, 
                functionName: 'balanceOf', 
                args: [addresses.finance!] 
            },
            
            // 2. دریافت وضعیت توقف (Paused)
            { 
                address: addresses.dao, 
                abi: rayanChainDaoAbi, 
                functionName: 'paused' 
            },

            // 3. دریافت شناسه پروپوزال بعدی (برای محاسبه تعداد کل)
            // ✅ اضافه شده برای رفع خطای تایپ‌اسکریپت
            {
                address: addresses.dao,
                abi: rayanChainDaoAbi,
                functionName: 'nextProposalId'
            }
        ],
        query: { 
            // شرط اجرا: متصل بودن، لود شدن آدرس‌ها و وجود آدرس‌های حیاتی
            enabled: isConnected && !isGlobalLoading && !!addresses.dao && !!addresses.finance,
            refetchInterval: 10000 
        }
    });

    const stats = useMemo(() => {
        // اگر هنوز داده‌ای نیامده یا ناقص است، نال برگردان
        if (!adminData || !adminData[0] || !adminData[1]) return null;
        
        // استخراج داده‌ها با بررسی وضعیت موفقیت
        const ownerResult = adminData[0];
        const treasuryResult = adminData[1];
        const pausedResult = adminData[2];
        const nextIdResult = adminData[3]; // ✅ دریافت نتیجه جدید

        // مقداردهی ایمن (Fallback Handling)
        const owner = (ownerResult.status === 'success' ? ownerResult.result : '0x0') as Address;
        const treasuryBalance = (treasuryResult.status === 'success' ? treasuryResult.result : 0n) as bigint;
        const isPaused = (pausedResult.status === 'success' ? pausedResult.result : false) as boolean;
        const nextProposalId = (nextIdResult.status === 'success' ? nextIdResult.result : 1n) as bigint;

        // محاسبه تعداد کل پروپوزال‌ها
        // چون nextProposalId از ۱ شروع می‌شود، تعداد کل برابر است با (nextId - 1)
        const totalProposals = Number(nextProposalId) > 0 ? Number(nextProposalId) - 1 : 0;

        return {
            owner,
            isPaused,
            treasuryBalance,
            formattedBalance: formatEther(treasuryBalance),
            totalProposals // ✅ حالا این پراپرتی وجود دارد و خطا رفع می‌شود
        };
    }, [adminData]);

    return {
        stats,
        isLoading: isGlobalLoading || isAdminLoading,
        refetch,
        error
    };
}