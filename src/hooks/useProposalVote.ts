// src/hooks/useProposalVote.ts - FIXED INFINITE LOOP

"use client";

import { useAccount, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
    const toastIdRef = useRef<string | number | null>(null);

    // ✅ FIX 1: Memoize args for hasVoted read
    const hasVotedArgs = useMemo(() => 
        (proposalId !== null && address) ? ([proposalId, address] as const) : undefined
    , [proposalId, address]);

    // --- Read Vote Status ---
    const { data: hasVotedResult } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'hasVoted',
        args: hasVotedArgs,
        query: { enabled: isVotingActive && !!address && !!hasVotedArgs },
    });
    const hasVoted = hasVotedResult ?? false;

    // ✅ FIX 2: Memoize args for Simulate
    const voteForArgs = useMemo(() => 
        proposalId !== null ? ([proposalId, VOTE_FOR] as const) : undefined
    , [proposalId]);

    const voteAgainstArgs = useMemo(() => 
        proposalId !== null ? ([proposalId, VOTE_AGAINST] as const) : undefined
    , [proposalId]);

    // --- Simulate Contracts ---
    const { data: voteForConfig } = useSimulateContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'vote',
        args: voteForArgs,
        query: { enabled: isVotingActive && !!voteForArgs },
    });

    const { data: voteAgainstConfig } = useSimulateContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'vote',
        args: voteAgainstArgs,
        query: { enabled: isVotingActive && !!voteAgainstArgs },
    });

    // --- Transaction Management ---
    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    const getErrorMessage = (err: any) => {
        const message = err?.message || '';
        if (message.includes("Already voted")) return t('toasts.error_already_voted');
        if (message.includes("User rejected")) return t('toasts.error_user_rejected');
        return t('toasts.error_generic');
    };

    useEffect(() => {
        if (!txHash) return;

        if (isSuccess) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.success(t('toasts.vote_successful'));
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
            setTxHash(undefined);
            toastIdRef.current = null;
        }

        if (isError) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(getErrorMessage(error));
            setTxHash(undefined);
            toastIdRef.current = null;
        }
    }, [isSuccess, isError, error, queryClient, t, txHash]);

    const handleVote = useCallback(async (voteType: 'for' | 'against') => {
        if (!isVotingActive || !daoAddress || proposalId === null) return;
        
        const voteEnum = voteType === 'for' ? VOTE_FOR : VOTE_AGAINST;
        toastIdRef.current = toast.loading(t('toasts.submitting_vote'));

        try {
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'vote',
                args: [proposalId, voteEnum],
            });
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
        } catch (err) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(getErrorMessage(err));
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