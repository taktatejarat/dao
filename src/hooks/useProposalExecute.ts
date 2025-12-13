// src/hooks/useProposalExecute.ts - CLEANED UP

"use client";

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError } from 'viem';
import { useQueryClient } from '@tanstack/react-query'; 
import { useState, useEffect, useCallback } from 'react';

interface UseProposalExecuteProps {
    daoAddress: Address | undefined;
    proposalId: bigint | null;
    isExecutable: boolean;
}

export function useProposalExecute({ daoAddress, proposalId, isExecutable }: UseProposalExecuteProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    useEffect(() => {
        if (!txHash) return;

        if (isSuccess) {
            toast.success(t('toasts.proposal_executed_successfully'));
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
            setTxHash(undefined);
        }

        if (isError) {
            toast.error(t('toasts.execution_failed'), { description: (error as BaseError)?.shortMessage || error?.message });
            setTxHash(undefined);
        }
    }, [isSuccess, isError, error, t, queryClient, txHash]);

    const handleExecute = useCallback(async () => {
        if (!isExecutable || !daoAddress || proposalId === null) return;
        
        const toastId = toast.loading(t('toasts.submitting_execution'));
        try {
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'executeProposal',
                args: [proposalId],
            });
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastId });

        } catch (err) {
            toast.error(t('toasts.transaction_rejected'), { id: toastId, description: (err as BaseError).shortMessage });
        }
    }, [isExecutable, daoAddress, proposalId, writeContractAsync, t]);

    return {
        handleExecute,
        isExecuting: isSubmitting || isConfirming,
    };
}