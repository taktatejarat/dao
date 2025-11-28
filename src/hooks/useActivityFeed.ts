// src/hooks/useActivityFeed.ts - FINAL, MODERN VERSION POWERED BY SWR

import useSWR from 'swr';
import { useWeb3 } from '@/context/Web3Provider';
import { formatAddress, formatNumber } from '@/lib/utils';
import { formatEther, type Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useMemo } from 'react';
import { useTranslation } from './use-translation'; // ✅ ایمپورت برای ترجمه

// --- Type Definitions and Helpers ---
export interface ActivityItem {
    id: string;
    user: string;
    action: string;
    timestamp: number;
}


// ✅ تابع fetcher عمومی برای SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

// ✅ تابع parseEvents اکنون t را به عنوان آرگومان می‌پذیرد
function parseEvents(events: any[], t: (key: string) => string): ActivityItem[] {
    if (!events || !Array.isArray(events)) return [];

    return events.map(event => {
        let action = t('activities.default_event').replace('{eventName}', event.eventName);
        const user = event.args?.user 
            ? formatAddress(event.args.user) 
            : (event.args?.proposer ? formatAddress(event.args.proposer) : t('activities.system_user'));

        switch (event.eventName) {
            case 'ProposalCreated':
                action = t('activities.created_proposal').replace('{id}', event.args.id);
                break;
            case 'Voted':
                const voteType = event.args.vote === 0 ? t('proposal_detail.for') : t('proposal_detail.against');
                action = t('activities.voted_on_proposal')
                    .replace('{voteType}', voteType)
                    .replace('{id}', event.args.proposalId);
                break;
            case 'Staked':
                action = t('activities.staked_amount').replace('{amount}', formatNumber(formatEther(event.args.amount)));
                break;
            case 'Unstaked':
                action = t('activities.unstaked_amount').replace('{amount}', formatNumber(formatEther(event.args.amount)));
                break;
            case 'MilestoneReleased':
                action = t('activities.milestone_released')
                    .replace('{milestoneIndex}', event.args.milestoneIndex)
                    .replace('{id}', event.args.proposalId);
                break;
            case 'OwnershipTransferred':
                action = t('activities.ownership_transferred');
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

export function useActivityFeed() {
    const { t } = useTranslation();
    const { registryAddress, isHydrated } = useWeb3();

    // ۱. خواندن آدرس‌های لازم از رجیستری (بدون تغییر)
    const { data: contractAddresses, isLoading: areAddressesLoading } = useReadContracts({
        contracts: [
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO] },
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] },
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] },
        ],
        query: { enabled: !!registryAddress && isHydrated },
    });

    const [daoAddress, stakingAddress, financeAddress] = useMemo(() =>
        contractAddresses?.map(d => d.result as Address) || [],
        [contractAddresses]
    );

    // ۲. ساخت URL های API به صورت داینامیک
    const urls = useMemo(() => {
        const activeUrls: string[] = [];
        if (daoAddress) activeUrls.push(`/api/events?contractAddress=${daoAddress}&contractName=RayanChainDAO`);
        if (stakingAddress) activeUrls.push(`/api/events?contractAddress=${stakingAddress}&contractName=Staking`);
        if (financeAddress) activeUrls.push(`/api/events?contractAddress=${financeAddress}&contractName=Finance`);
        return activeUrls;
    }, [daoAddress, stakingAddress, financeAddress]);

    // ✅✅✅ THE CRITICAL FIX: استفاده از useSWR برای واکشی موازی ✅✅✅
    // SWR به صورت خودکار تمام URL ها را به صورت موازی fetch می‌کند.
    const { data: results, error, isLoading: isSWRLoading } = useSWR(
        // اگر آدرس‌ها آماده بودند، URL ها را برای fetch ارسال کن
        !areAddressesLoading && urls.length > 0 ? urls : null,
        (urls: string[]) => Promise.all(urls.map(url => fetcher(url)))
    );

    // ۳. ترکیب و پردازش نتایج
    const { activities, error: processingError } = useMemo(() => {
        if (!results) return { activities: [], error: null };
        try {
            let allActivities: ActivityItem[] = [];
            for (const result of results) {
                if (result.success) {
                    const parsed = parseEvents(result.result, t);
                    allActivities.push(...parsed);
                }
            }
            allActivities.sort((a, b) => b.timestamp - a.timestamp);
            return { activities: allActivities.slice(0, 20), error: null };
        } catch (err) {
            return { activities: [], error: (err as Error).message };
        }
    }, [results, t]);

    const finalError = error?.message || processingError;
    const isLoading = areAddressesLoading || (urls.length > 0 && isSWRLoading);

    return { activities, isLoading, error: finalError };
}