// src/hooks/useProposalVote.ts - FINAL, BULLETPROOF VERSION

"use client";

import { useAccount, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError } from 'viem';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseProposalVoteProps {
    daoAddress: Address | undefined;
    proposalId: bigint | null; // می‌تواند null باشد
    isVotingActive: boolean;
}

// VoteType enum values from the smart contract
const VOTE_FOR = 0;
const VOTE_AGAINST = 1;

export function useProposalVote({ daoAddress, proposalId, isVotingActive }: UseProposalVoteProps) {
    const { t } = useTranslation();
    const { address } = useAccount();
    const queryClient = useQueryClient();

    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    // ✅ FIX: استفاده از Ref برای نگهداری شناسه Toast در طول چرخه حیات کامپوننت
    const toastIdRef = useRef<string | number | null>(null);

    // --- خواندن وضعیت رأی کاربر ---
    const { data: hasVotedResult } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'hasVoted',
        args: [proposalId!, address!],
        query: { enabled: isVotingActive && !!address && proposalId !== null },
    });
    const hasVoted = hasVotedResult ?? false;

    // --- مدیریت تراکنش ---
    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    // ✅✅✅ useEffect اصلاح شده برای مدیریت تمیز Toast ها ✅✅✅
    useEffect(() => {
        if (!txHash) return;

        if (isSuccess) {
            // 1. حذف پیام "در حال انتظار" قبلی
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            
            // 2. نمایش پیام موفقیت
            toast.success(t('toasts.vote_successful'));
            
            // 3. رفرش داده‌ها
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
            
            // 4. پاکسازی وضعیت
            setTxHash(undefined);
            toastIdRef.current = null;
        }

        if (isError) {
            // 1. حذف پیام "در حال انتظار" قبلی
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            
            // 2. نمایش خطا
            toast.error(t('toasts.transaction_failed'), { description: (error as BaseError)?.shortMessage || error?.message });
            
            // 3. پاکسازی
            setTxHash(undefined);
            toastIdRef.current = null;
        }
    }, [isSuccess, isError, error, queryClient, t, txHash]);

    // --- Simulation hooks (بدون تغییر) ---
    const { data: voteForConfig } = useSimulateContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'vote',
        args: [proposalId!, VOTE_FOR],
        query: { enabled: isVotingActive && proposalId !== null },
    });
    const { data: voteAgainstConfig } = useSimulateContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'vote',
        args: [proposalId!, VOTE_AGAINST],
        query: { enabled: isVotingActive && proposalId !== null },
    });

    /**
     * Handles the vote submission using our standard, robust pattern.
     */
    const handleVote = useCallback(async (voteType: 'for' | 'against') => {
        if (!isVotingActive || !daoAddress || proposalId === null) return;
        
        const voteEnum = voteType === 'for' ? VOTE_FOR : VOTE_AGAINST;
        // ✅ ذخیره ID توست در Ref
        toastIdRef.current = toast.loading(t('toasts.submitting_vote'));

        try {
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'vote',
                args: [proposalId, voteEnum],
            });
            setTxHash(hash);
            // آپدیت پیام موجود به جای ساخت پیام جدید
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
        } catch (err) {
            // اگر کاربر در کیف پول رد کرد، پیام لودینگ را ببند
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(t('toasts.transaction_rejected'), { description: (err as BaseError).shortMessage });
        }
    }, [isVotingActive, daoAddress, proposalId, writeContractAsync, t]);

    return {
        handleVote,
        isVotingPending: isSubmitting || isConfirming,
        canVoteFor: !!voteForConfig?.request && !hasVoted,
        canVoteAgainst: !!voteAgainstConfig?.request && !hasVoted,
        hasVoted,
    };
}