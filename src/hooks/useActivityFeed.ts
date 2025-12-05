// src/hooks/useActivityFeed.ts - CORRECT ADDRESS DETECTION

import useSWR from 'swr';
import { useWeb3 } from '@/context/Web3Provider';
import { formatAddress, formatNumber } from '@/lib/utils';
import { formatEther, type Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useMemo } from 'react';
import { useTranslation } from './use-translation';

export interface ActivityItem {
    id: string;
    user: string;
    action: string;
    timestamp: number;
}

// --- Helper to Fix Type Error ---
const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    const t = (key: string, params?: any) => (originalT as any)(key, params);
    return { t, locale };
};

const parseEvents = (events: any[], t: any, locale: string): ActivityItem[] => {
    if (!events || !Array.isArray(events)) return [];

    return events.map(event => {
        const args = event.args || {};
        let addressToDisplay: string | undefined;
        let actionKey = 'activities.unknown_action';
        let actionParams: any = {};

        // 1. تشخیص آدرس کاربر بر اساس نوع رویداد
        switch (event.eventName) {
            case 'ProposalCreated':
                addressToDisplay = args.proposer;
                actionKey = 'activities.proposal_created';
                actionParams = { id: args.id?.toString() };
                break;
                
            case 'Voted':
                addressToDisplay = args.voter; // ✅ اصلاح شد
                const voteKey = args.vote === 0 ? 'proposal_detail.vote_for' : 'proposal_detail.vote_against';
                actionKey = 'activities.voted';
                actionParams = { id: args.proposalId?.toString(), vote: t(voteKey) };
                break;
                
            case 'Staked':
                addressToDisplay = args.user; // ✅ اصلاح شد
                actionKey = 'activities.staked';
                actionParams = { amount: formatNumber(formatEther(args.amount || 0n), locale) };
                break;
                
            case 'Unstaked':
                addressToDisplay = args.user;
                actionKey = 'activities.unstaked';
                actionParams = { amount: formatNumber(formatEther(args.amount || 0n), locale) };
                break;
                
            case 'RewardClaimed':
                addressToDisplay = args.user;
                actionKey = 'activities.reward_claimed';
                actionParams = { amount: formatNumber(formatEther(args.reward || 0n), locale) };
                break;
                
            case 'InvestmentReceived':
                addressToDisplay = args.investor; // ✅ اصلاح شد
                actionKey = 'activities.invested';
                actionParams = { amount: formatNumber(formatEther(args.amount || 0n), locale), id: args.proposalId?.toString() };
                break;
                
            case 'OwnershipTransferred':
                addressToDisplay = args.newOwner;
                actionKey = 'activities.ownership_transferred';
                break;

            case 'ProposalStateChanged':
                // این رویداد معمولاً توسط سیستم یا ادمین تریگر می‌شود
                // اگر transaction.from را نداریم، "System" نمایش می‌دهیم
                addressToDisplay = undefined; 
                const states = ['Pending', 'Validation', 'Voting', 'Approved', 'Rejected', 'Executed', 'Expired', 'Cancelled', 'Funding', 'Funded', 'Failed'];
                actionKey = 'activities.state_changed';
                actionParams = { id: args.id?.toString(), state: states[Number(args.newState)] || 'Unknown' };
                break;
                
            default:
                // Fallback: سعی کن هر آدرسی پیدا می‌کنی بردار
                addressToDisplay = args.user || args.from || args.account || args.sender;
        }

        // فرمت کردن نام کاربر
        const user = addressToDisplay 
            ? formatAddress(addressToDisplay) 
            : t('activities.system');

        return {
            id: event.transactionHash,
            user,
            action: t(actionKey, actionParams),
            timestamp: parseInt(event.timeStamp, 10),
        };
    });
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useActivityFeed() {
    const { t, locale } = useSafeTranslation();
    const { registryAddress, isHydrated } = useWeb3();

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

    const urls = useMemo(() => {
        const activeUrls: string[] = [];
        if (daoAddress) activeUrls.push(`/api/events?contractAddress=${daoAddress}&contractName=RayanChainDAO`);
        if (stakingAddress) activeUrls.push(`/api/events?contractAddress=${stakingAddress}&contractName=Staking`);
        if (financeAddress) activeUrls.push(`/api/events?contractAddress=${financeAddress}&contractName=Finance`);
        return activeUrls;
    }, [daoAddress, stakingAddress, financeAddress]);

    const { data: results, error, isLoading: isSWRLoading } = useSWR(
        !areAddressesLoading && urls.length > 0 ? urls : null,
        (urls: string[]) => Promise.all(urls.map(url => fetcher(url)))
    );

    const { activities, error: processingError } = useMemo(() => {
        if (!results) return { activities: [], error: null };
        try {
            let allActivities: ActivityItem[] = [];
            for (const result of results) {
                if (result.success) {
                    const parsed = parseEvents(result.result, t, locale);
                    allActivities.push(...parsed);
                }
            }
            allActivities.sort((a, b) => b.timestamp - a.timestamp);
            return { activities: allActivities.slice(0, 20), error: null };
        } catch (err) {
            return { activities: [], error: (err as Error).message };
        }
    }, [results, t, locale]);

    const finalError = error?.message || processingError;
    const isLoading = areAddressesLoading || (urls.length > 0 && isSWRLoading);

    return { activities, isLoading, error: finalError };
}