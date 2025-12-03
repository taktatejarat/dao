// src/hooks/useDelegateDashboard.ts

import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { stakingAbi, rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { useDashboardStats } from './useDashboardStats';

export function useDelegateDashboard() {
    const { address, isConnected } = useAccount();
    const { addresses, isLoading: isGlobalLoading } = useDashboardStats();

    const { data: delegateData, isLoading: isDelegateLoading, refetch } = useReadContracts({
        contracts: [
            // ۱. کل قدرت رای (شامل دارایی خود + نمایندگی گرفته شده)
            { address: addresses.staking, abi: stakingAbi, functionName: 'votingPower', args: [address!] },
            // ۲. قدرتی که فقط از طریق نمایندگی (Delegation) دریافت شده
            { address: addresses.staking, abi: stakingAbi, functionName: 'delegatedPower', args: [address!] },
            // ۳. دارایی شخصی استیک شده (Skin in the game)
            { address: addresses.staking, abi: stakingAbi, functionName: 'getStakedAmount', args: [address!] },
            // ۴. امتیاز مشارکت (نشان دهنده فعال بودن نماینده)
            { address: addresses.dao, abi: rayanChainDaoAbi, functionName: 'participationScores', args: [address!] },
        ],
        query: { 
            enabled: isConnected && !isGlobalLoading && !!addresses.staking && !!addresses.dao,
            refetchInterval: 15000 
        }
    });

    const stats = useMemo(() => {
        if (!delegateData) return null;
        
        const totalVotingPower = delegateData[0].result as bigint ?? 0n;
        const receivedDelegation = delegateData[1].result as bigint ?? 0n;
        const selfStaked = delegateData[2].result as bigint ?? 0n;
        const participationScore = delegateData[3].result as bigint ?? 0n;

        // محاسبه درصد نفوذ: (قدرت نمایندگی / کل قدرت) * ۱۰۰
        // اگر کل قدرت ۰ باشد، درصد ۰ است
        const delegationPercentage = totalVotingPower > 0n 
            ? Number((receivedDelegation * 100n) / totalVotingPower) 
            : 0;

        return {
            totalVotingPower,
            receivedDelegation,
            selfStaked,
            participationScore,
            delegationPercentage
        };
    }, [delegateData]);

    return {
        stats,
        isLoading: isGlobalLoading || isDelegateLoading,
        refetch
    };
}