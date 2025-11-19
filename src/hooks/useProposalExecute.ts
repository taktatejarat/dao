// src/hooks/useProposalExecute.ts (فایل جدید)

"use client";

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError } from 'viem';

interface UseProposalExecuteProps {
    daoAddress: Address | undefined;
    proposalId: bigint;
    isExecutable: boolean;
}

export function useProposalExecute({ daoAddress, proposalId, isExecutable }: UseProposalExecuteProps) {
    const { t } = useTranslation();
    const { data: hash, isPending, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    const handleExecute = async () => {
        if (!isExecutable) return;
        const toastId = 'execute-toast';
        try {
            toast.loading(t('toasts.sending_transaction'), { id: toastId });
            const txHash = await writeContractAsync({
                address: daoAddress!,
                abi: rayanChainDaoAbi,
                functionName: 'executeProposal',
                args: [proposalId],
            });
            toast.success(t('toasts.transaction_sent'), { id: toastId, description: txHash });
        } catch (err) {
            toast.error(t('toasts.transaction_failed'), { id: toastId, description: (err as BaseError).shortMessage });
        }
    };

    return {
        handleExecute,
        isExecuting: isPending || isConfirming,
    };
}