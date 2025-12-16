// src/hooks/useProposalVote.ts - FIXED TOASTS

"use client";

import { useAccount, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseProposalVoteProps {
    daoAddress: Address | undefined;
    proposalId: bigint | null;
    isVotingActive: boolean;
}

const VOTE_FOR = 0;
const VOTE_AGAINST = 1;

export function useProposalVote({ daoAddress, proposalId, isVotingActive }: UseProposalVoteProps) {
    const { t } = useTranslation();
    const { address } = useAccount();
    const queryClient = useQueryClient();

    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    // ذخیره ID توست برای آپدیت یا بستن آن
    const toastIdRef = useRef<string | number | null>(null);

    // --- Memoized Args ---
    const hasVotedArgs = useMemo(() => 
        (proposalId !== null && address) ? ([proposalId, address] as const) : undefined
    , [proposalId, address]);

    // --- Read ---
    const { data: hasVotedResult } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'hasVoted',
        args: hasVotedArgs,
        query: { enabled: isVotingActive && !!address && !!hasVotedArgs },
    });
    const hasVoted = hasVotedResult ?? false;

    // --- Write ---
    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    // --- Toast & Effect Logic ---
    useEffect(() => {
        if (!txHash) return; // اگر تراکنشی نیست کاری نکن

        if (isSuccess) {
            // Dismiss previous loading toast
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            // Show success
            toast.success(t('toasts.vote_successful'));
            
            // Refresh Data
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
            
            // Reset
            setTxHash(undefined);
            toastIdRef.current = null;
        }

        if (isError) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            
            const msg = error?.message?.includes("User rejected") 
                ? t('toasts.error_user_rejected') 
                : t('toasts.error_generic');
            
            toast.error(msg);
            setTxHash(undefined);
            toastIdRef.current = null;
        }
    }, [isSuccess, isError, error, queryClient, t, txHash]);

    const handleVote = useCallback(async (voteType: 'for' | 'against') => {
        if (!isVotingActive || !daoAddress || proposalId === null) return;
        
        const voteEnum = voteType === 'for' ? VOTE_FOR : VOTE_AGAINST;
        
        // ایجاد Toast لودینگ و ذخیره ID
        toastIdRef.current = toast.loading(t('toasts.submitting_vote'));

        try {
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'vote',
                args: [proposalId, voteEnum],
            });
            setTxHash(hash);
            // آپدیت پیام تست به "در حال انتظار برای تایید شبکه"
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
        } catch (err) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            // اگر کاربر رد کرد یا خطا داد
            toast.error(t('toasts.transaction_rejected'));
        }
    }, [isVotingActive, daoAddress, proposalId, writeContractAsync, t]);

    return {
        handleVote,
        isVotingPending: isSubmitting || isConfirming,
        hasVoted,
    };
}