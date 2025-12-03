// src/hooks/useInvestorDashboard.ts - NEW SPECIALIZED HOOK

import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { rayanChainTokenAbi, stakingAbi, rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { useDashboardStats } from './useDashboardStats';

export function useInvestorDashboard() {
    const { address, isConnected } = useAccount();
    const { addresses, isLoading: isGlobalLoading } = useDashboardStats();

    // فقط وقتی اجرا می‌شود که آدرس‌ها لود شده باشند
    const { data: investorData, isLoading: isInvestorLoading, refetch } = useReadContracts({
        contracts: [
            // موجودی کیف پول
            { address: addresses.token, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [address!] },
            // مقدار استیک شده
            { address: addresses.staking, abi: stakingAbi, functionName: 'getStakedAmount', args: [address!] },
            // پاداش‌های قابل برداشت (Claimable Rewards)
            { address: addresses.staking, abi: stakingAbi, functionName: 'earned', args: [address!] },
            // قدرت رای‌دهی فعلی
            { address: addresses.staking, abi: stakingAbi, functionName: 'votingPower', args: [address!] },
             // امتیاز مشارکت (برای محاسبه وزن رای)
            { address: addresses.dao, abi: rayanChainDaoAbi, functionName: 'participationScores', args: [address!] },
        ],
        query: { 
            enabled: isConnected && !isGlobalLoading && !!addresses.token && !!addresses.staking,
            refetchInterval: 10000 // هر ۱۰ ثانیه (برای دیدن سود لحظه‌ای)
        }
    });

    const stats = useMemo(() => {
        if (!investorData) return null;
        return {
            walletBalance: investorData[0].result as bigint ?? 0n,
            stakedAmount: investorData[1].result as bigint ?? 0n,
            claimableRewards: investorData[2].result as bigint ?? 0n,
            votingPower: investorData[3].result as bigint ?? 0n,
            participationScore: investorData[4].result as bigint ?? 0n,
        };
    }, [investorData]);

    return {
        stats,
        isLoading: isGlobalLoading || isInvestorLoading,
        refetch
    };
}