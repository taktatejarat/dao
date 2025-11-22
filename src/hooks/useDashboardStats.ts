// src/hooks/useDashboardStats.ts - STABLE & FINAL VERSION

import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { useWeb3 } from '@/context/Web3Provider';
import { daoRegistryAbi, rayanChainDaoAbi, rayanChainTokenAbi, stakingAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import type { Address } from "viem";

export function useDashboardStats() {
    const { address, isConnected } = useAccount();
    const { registryAddress, isHydrated } = useWeb3();

    // ۱. خواندن آدرس‌های اصلی
    const { data: addressResults, isLoading: areAddressesLoading } = useReadContracts({
        contracts: [
            // ✅✅✅ FIX: استفاده از daoRegistryAbi برای تمام فراخوانی‌های getAddress ✅✅✅
            { address: registryAddress!, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO] },
            { address: registryAddress!, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN] },
            { address: registryAddress!, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] },
            { address: registryAddress!, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] },
        ],
        query: { enabled: !!registryAddress && isHydrated }
    });
    
    const { dao, token, finance, staking } = useMemo(() => ({
        dao: addressResults?.[0]?.result as Address | undefined,
        token: addressResults?.[1]?.result as Address | undefined,
        finance: addressResults?.[2]?.result as Address | undefined,
        staking: addressResults?.[3]?.result as Address | undefined,
    }), [addressResults]);

    // ۲. خواندن تمام آمارهای داشبورد
    const { data: dashboardData, isLoading: areStatsLoading, refetch } = useReadContracts({
        contracts: [
            { address: token, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [address!] },
            // ✅✅✅ FIX: اصلاح نام تابع به getStakedAmount ✅✅✅
            { address: staking, abi: stakingAbi, functionName: 'getStakedAmount', args: [address!] },
            { address: dao, abi: rayanChainDaoAbi, functionName: 'participationScores', args: [address!] },
            { address: dao, abi: rayanChainDaoAbi, functionName: 'nextProposalId' },
            { address: token, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [finance!] },
            { address: staking, abi: stakingAbi, functionName: 'totalSupply' },
        ],
        query: { 
            enabled: isConnected && !!dao && !!token && !!finance && !!staking,
            refetchInterval: 30000,
        }
    });

    // ۳. پارس کردن نتایج
    const stats = useMemo(() => {
        if (!dashboardData) return {};
        const [
            userBalance, userStaked, userPoPScore,
            proposalCountResult, treasuryBalanceResult, totalStakedResult
        ] = dashboardData.map(d => d.result);

        return {
            userBalance: userBalance as bigint | undefined,
            userStaked: userStaked as bigint | undefined,
            userPoPScore: userPoPScore as bigint | undefined,
            proposalCount: proposalCountResult ? (Number(proposalCountResult as bigint) > 0 ? Number(proposalCountResult as bigint) - 1 : 0) : 0,
            treasuryBalance: treasuryBalanceResult as bigint | undefined,
            totalStaked: totalStakedResult as bigint | undefined,
        };
    }, [dashboardData]);

    return {
        stats,
        addresses: { dao, token, finance, staking },
        isLoading: areAddressesLoading || (isConnected && areStatsLoading),
        refetchStats: refetch
    };
}