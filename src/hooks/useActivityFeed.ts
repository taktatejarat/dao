// src/hooks/useActivityFeed.ts - FINAL, CORRECTED VERSION

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Provider';
import { formatAddress, formatNumber } from '@/lib/utils';
import { formatEther, type Address } from 'viem';
import { useReadContracts } from 'wagmi'; // ✅ ایمپورت هوک جدید
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';

// تعریف نوع داده برای یک آیتم فعالیت
export interface ActivityItem { id: string; user: string; action: string; timestamp: number; }


export function useActivityFeed() {
    // ✅ FIX: ما فقط به registryAddress و isHydrated نیاز داریم
    const { registryAddress, isHydrated } = useWeb3();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ✅✅✅ THE FIX IS HERE: خواندن آدرس‌های لازم از رجیستری ✅✅✅
    const { data: contractAddresses, isLoading: areAddressesLoading } = useReadContracts({
        contracts: [
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO] },
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] },
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] },
        ],
        query: {
            enabled: !!registryAddress && isHydrated,
        }
    });

    const [daoAddress, stakingAddress, financeAddress] = contractAddresses?.map(d => d.result as Address) || [];

    useEffect(() => {
        // منتظر می‌مانیم تا آدرس‌ها بارگذاری شوند
        if (areAddressesLoading || !isHydrated) {
            return;
        }

        // اگر هیچ آدرسی پیدا نشد، واکشی را متوقف می‌کنیم
        if (!daoAddress && !stakingAddress && !financeAddress) {
            setIsLoading(false);
            return;
        }

        const fetchActivities = async () => {
            setIsLoading(true);
            try {
                // لیستی از درخواست‌هایی که باید ارسال شوند را می‌سازیم
                const fetchPromises = [];
                if (daoAddress) {
                    fetchPromises.push(fetch(`/api/events?contractAddress=${daoAddress}&contractName=RayanChainDAO`));
                }
                if (stakingAddress) {
                    fetchPromises.push(fetch(`/api/events?contractAddress=${stakingAddress}&contractName=Staking`));
                }
                if (financeAddress) {
                    fetchPromises.push(fetch(`/api/events?contractAddress=${financeAddress}&contractName=Finance`));
                }

                const responses = await Promise.all(fetchPromises);
                let allActivities: ActivityItem[] = [];

                for (const res of responses) {
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            const parsed = parseEvents(data.result);
                            allActivities = [...allActivities, ...parsed];
                        }
                    }
                }

                allActivities.sort((a, b) => b.timestamp - a.timestamp);
                setActivities(allActivities.slice(0, 20));

            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();

    }, [daoAddress, stakingAddress, financeAddress, areAddressesLoading, isHydrated]); // وابستگی‌ها به‌روز شد

    return { activities, isLoading, error };
}

// ... (تابع parseEvents را در اینجا یا در یک فایل utils قرار دهید)
function parseEvents(events: any[]): ActivityItem[] {
    return events.map(event => {
        let action = `Triggered event: ${event.eventName}`;
        const user = event.args?.user ? formatAddress(event.args.user) : (event.args?.proposer ? formatAddress(event.args.proposer) : 'System');

        switch (event.eventName) {
            case 'ProposalCreated':
                action = `created Proposal #${event.args.id}`;
                break;
            case 'Voted':
                const voteType = event.args.vote === 0 ? 'For' : 'Against';
                action = `voted ${voteType} on Proposal #${event.args.proposalId}`;
                break;
            case 'Staked':
                action = `staked ${formatNumber(formatEther(event.args.amount))} RYC`;
                break;
            case 'Unstaked':
                action = `unstaked ${formatNumber(formatEther(event.args.amount))} RYC`;
                break;
            case 'MilestoneReleased':
                action = `released milestone #${event.args.milestoneIndex} for Proposal #${event.args.proposalId}`;
                break;
        }

        return {
            id: event.transactionHash,
            user,
            action,
            timestamp: parseInt(event.timeStamp, 10),
        };
    });
}