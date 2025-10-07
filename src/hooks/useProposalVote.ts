"use client";

import { useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { formatAddress } from '@/lib/utils';
import type { Address } from 'viem';
import { BaseError } from 'viem';

interface UseProposalVoteProps {
    daoAddress: Address | undefined;
    proposalId: bigint;
    isVotingActive: boolean;
}

// VoteType enum values from the smart contract
const VOTE_FOR = 0;
const VOTE_AGAINST = 1;

/**
 * A custom hook to handle all logic related to voting on a proposal.
 * This version calls `writeContract` directly to avoid wagmi's complex type inference issues.
 * `useSimulateContract` is only used to determine if the vote buttons should be enabled.
 */
export function useProposalVote({ daoAddress, proposalId, isVotingActive }: UseProposalVoteProps) {
    const { t } = useTranslation();

    const { data: hash, isPending, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

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
        // The result of the simulation is used to enable/disable the button
        canVoteFor: !!voteForConfig?.request,
        canVoteAgainst: !!voteAgainstConfig?.request,
    };
}