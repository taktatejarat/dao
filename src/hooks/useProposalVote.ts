"use client";

import { useAccount, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { formatAddress } from '@/lib/utils';
import type { Address } from 'viem';
import { BaseError } from 'viem';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseProposalVoteProps {
    daoAddress: Address | undefined;
    proposalId: bigint;
    isVotingActive: boolean;
}

// VoteType enum values from the smart contract
const VOTE_FOR = 0;
const VOTE_AGAINST = 1;

export function useProposalVote({ daoAddress, proposalId, isVotingActive }: UseProposalVoteProps) {
    const { t } = useTranslation();
    const { address } = useAccount();
    const queryClient = useQueryClient(); // ✅ برای invalidate کردن query ها

     // --- خواندن وضعیت رأی کاربر ---
    const { data: hasVotedResult, refetch: refetchHasVoted } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'hasVoted',
        args: [proposalId, address!],
        query: { enabled: isVotingActive && !!address },
    });
    const hasVoted = hasVotedResult ?? false;

        // --- شبیه‌سازی و ارسال تراکنش ---
    const { data: hash, isPending, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    // ✅✅✅ THE FIX IS HERE: استفاده از useEffect به جای onSuccess ✅✅✅
    useEffect(() => {
        if (isConfirmed) {
            toast.success(t('toasts.vote_confirmed'));
            // داده‌های مربوط به hasVoted و proposals را مجدداً واکشی می‌کنیم تا UI به‌روز شود
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
        }
    }, [isConfirmed, queryClient, t]);

    // --- Simulation hooks are now ONLY for UI logic (enabling/disabling buttons) ---
    const { data: voteForConfig } = useSimulateContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'vote',
        args: [proposalId, VOTE_FOR],
        query: { enabled: isVotingActive },
    });

    const { data: voteAgainstConfig } = useSimulateContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'vote',
        args: [proposalId, VOTE_AGAINST],
        query: { enabled: isVotingActive },
    });

    /**
     * Handles the vote submission by calling writeContract directly with all necessary parameters.
     * @param {'for' | 'against'} voteType - The type of vote to submit.
     */
    const handleVote = async (voteType: 'for' | 'against') => {
        if (!isVotingActive) return;
        const request = (voteType === 'for' ? voteForConfig?.request : voteAgainstConfig?.request) as any;
        if (!request) return;
        try {
            const txHash = await writeContractAsync(request);
            toast.success(`${t('proposal_detail.vote_success_desc')} ${formatAddress(txHash)}`);
        } catch (err) {
            toast.error((err as BaseError).shortMessage || t('proposal_detail.unexpected_error_desc'));
        }
    };

    return {
            handleVote,
            isVotingPending: isPending || isConfirming,
            canVoteFor: !!voteForConfig?.request && !hasVoted,
            canVoteAgainst: !!voteAgainstConfig?.request && !hasVoted,
            hasVoted,
        };
    }