// src/hooks/useProposalVote.ts - FINAL, BULLETPROOF VERSION

"use client";

import { useAccount, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError } from 'viem';
import { useEffect, useState, useCallback } from 'react';
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

    // --- خواندن وضعیت رأی کاربر (بدون تغییر) ---
    const { data: hasVotedResult } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'hasVoted',
        args: [proposalId!, address!],
        query: { enabled: isVotingActive && !!address && proposalId !== null },
    });
    const hasVoted = hasVotedResult ?? false;

    // --- شبیه‌سازی و ارسال تراکنش ---
    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    // ✅✅✅ useEffect متمرکز برای مدیریت نتیجه نهایی تراکنش ✅✅✅
    useEffect(() => {
        if (!txHash) return;

        if (isSuccess) {
            toast.success(t('toasts.vote_successful'));
            // داده‌های مربوط به hasVoted و proposals را مجدداً واکشی می‌کنیم تا UI به‌روز شود
            // این کار باعث می‌شود دکمه‌های رأی‌گیری غیرفعال شده و تعداد آرا آپدیت شود.
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
            setTxHash(undefined);
        }

        if (isError) {
            toast.error(t('toasts.transaction_failed'), { description: (error as BaseError)?.shortMessage || error?.message });
            setTxHash(undefined);
        }
    }, [isSuccess, isError, error, queryClient, t]);

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
        const toastId = toast.loading(t('toasts.submitting_vote'));

        try {
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'vote',
                args: [proposalId, voteEnum],
            });
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastId });
        } catch (err) {
            toast.error(t('toasts.transaction_rejected'), { id: toastId, description: (err as BaseError).shortMessage });
        }
    }, [isVotingActive, daoAddress, proposalId, writeContractAsync, t]);

    return {
        handleVote,
        isVotingPending: isSubmitting || isConfirming,
        // ✅ منطق canVote اکنون ساده‌تر و قابل اعتمادتر است
        canVoteFor: !!voteForConfig?.request && !hasVoted,
        canVoteAgainst: !!voteAgainstConfig?.request && !hasVoted,
        hasVoted,
    };
}