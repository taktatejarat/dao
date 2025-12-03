// src/hooks/useDashboardStats.ts - FINAL LITE VERSION (Global Protocol Stats)

import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { useWeb3 } from '@/context/Web3Provider';
import { daoRegistryAbi, rayanChainTokenAbi, stakingAbi, rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import type { Address } from "viem";

export function useDashboardStats() {
    const { isConnected } = useAccount();
    const { registryAddress, isHydrated, userRole } = useWeb3();

    // ۱. فقط آدرس‌های حیاتی را می‌خوانیم
    const { data: addressesData, isLoading: isAddrLoading } = useReadContracts({
        contracts: [
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] },
            { address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] },
        ],
        query: { enabled: !!registryAddress && isHydrated, staleTime: Infinity } // آدرس‌ها به ندرت عوض می‌شوند
    });

    const addresses = useMemo(() => ({
        dao: addressesData?.[0]?.result as Address | undefined,
        token: addressesData?.[1]?.result as Address | undefined,
        staking: addressesData?.[2]?.result as Address | undefined,
        finance: addressesData?.[3]?.result as Address | undefined,
    }), [addressesData]);

    // ۲. خواندن آمار کلی پلتفرم (فقط چیزهایی که برای هدر یا فوتر داشبورد لازم است)
    const { data: globalData, isLoading: isGlobalLoading } = useReadContracts({
        contracts: [
            { address: addresses.staking, abi: stakingAbi, functionName: 'totalVotingPower' },
            { address: addresses.token, abi: rayanChainTokenAbi, functionName: 'totalSupply' },
        ],
        query: { 
            enabled: isConnected && !!addresses.staking && !!addresses.token,
            refetchInterval: 60000 // هر ۱ دقیقه (نیازی به آپدیت لحظه‌ای نیست)
        }
    });

    const globalStats = useMemo(() => ({
        totalVotingPower: globalData?.[0]?.result as bigint | undefined,
        totalSupply: globalData?.[1]?.result as bigint | undefined,
    }), [globalData]);

    return {
        addresses,
        globalStats,
        userRole,
        isLoading: isAddrLoading || (isConnected && isGlobalLoading)
    };
}