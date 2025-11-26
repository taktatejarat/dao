// src/hooks/useMilestoneRelease.ts

"use client";

import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, keccak256, toHex } from 'viem';
import { useRouter } from 'next/navigation';

interface UseMilestoneReleaseProps {
    daoAddress: Address | undefined;
    originalProposalId: bigint;
}

export function useMilestoneRelease({ daoAddress, originalProposalId }: UseMilestoneReleaseProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    useEffect(() => {
        if (isSuccess) {
            toast.success(t('toasts.milestone_proposal_created'));
            // رفرش یا هدایت به صفحه پروپوزال‌های جدید
            setTimeout(() => router.push('/proposals'), 2000);
            setTxHash(undefined);
        }
        if (isError) {
            toast.error(t('toasts.transaction_failed'), { description: (error as BaseError)?.shortMessage });
            setTxHash(undefined);
        }
    }, [isSuccess, isError, error, t, router]);

    const requestRelease = useCallback(async (proofDescription: string) => {
        if (!daoAddress) return;
        
        const toastId = toast.loading(t('toasts.submitting_milestone_release'));
        
        try {
            // ایجاد هش برای توضیحات پیشرفت کار (Proof of Progress)
            // در نسخه واقعی، این می‌تواند هش فایل آپلود شده در IPFS باشد
            const proofHash = keccak256(toHex(proofDescription));
            const descriptionHash = keccak256(toHex(`Milestone Release for Proposal #${originalProposalId}: ${proofDescription}`));

            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'createMilestoneReleaseProposal',
                args: [
                    originalProposalId,
                    proofHash,
                    descriptionHash
                ],
            });
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastId });

        } catch (err) {
            toast.error(t('toasts.transaction_rejected'), { id: toastId, description: (err as BaseError).shortMessage });
        }
    }, [daoAddress, originalProposalId, writeContractAsync, t]);

    return {
        requestRelease,
        isreleasing: isSubmitting || isConfirming
    };
}