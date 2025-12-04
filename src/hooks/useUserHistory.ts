// src/hooks/useUserHistory.ts

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3 } from '@/context/Web3Provider';
import { useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useReadContract } from 'wagmi';

export interface HistoryItem {
    id: string; // Transaction Hash
    proposalId: string;
    voteType: 0 | 1; // 0: For, 1: Against (طبق قرارداد شما)
    weight: string;
    date: number; // Timestamp
    blockNumber: string;
}

export function useUserHistory() {
    const { address, isConnected } = useAccount();
    const { registryAddress, isHydrated } = useWeb3();

    // 1. دریافت آدرس DAO
    const { data: daoAddress } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.DAO],
        query: { enabled: !!registryAddress && isHydrated }
    });

    // 2. دریافت رویدادها از API
    const { data: eventsData, isLoading, error } = useQuery({
        queryKey: ['user-voting-history', daoAddress, address],
        queryFn: async () => {
            if (!daoAddress) return [];
            const response = await fetch(`/api/events?contractAddress=${daoAddress}&contractName=RayanChainDAO`);
            if (!response.ok) throw new Error('Failed to fetch history');
            return response.json();
        },
        enabled: isConnected && !!daoAddress && !!address,
        staleTime: 60000, // کش برای 1 دقیقه
    });

    // 3. فیلتر و پردازش داده‌ها
    const history: HistoryItem[] = useMemo(() => {
        if (!eventsData?.result || !address) return [];

        const allEvents: any[] = eventsData.result;

        return allEvents
            .filter(event => 
                event.eventName === 'Voted' && 
                event.args?.voter?.toLowerCase() === address.toLowerCase()
            )
            .map(event => ({
                id: event.transactionHash,
                proposalId: event.args.proposalId?.toString() || '?',
                voteType: Number(event.args.vote) as 0 | 1,
                weight: event.args.weight?.toString() || '0',
                date: Number(event.timeStamp),
                blockNumber: event.blockNumber
            }))
            .sort((a, b) => b.date - a.date); // مرتب‌سازی از جدید به قدیم

    }, [eventsData, address]);

    return {
        history,
        isLoading,
        error
    };
}