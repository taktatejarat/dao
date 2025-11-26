// src/hooks/useMilestoneRelease.ts

"use client";

import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { keccak256, toHex, BaseError } from 'viem';
import { useRouter } from 'next/navigation';

interface UseMilestoneReleaseProps {
    daoAddress: `0x${string}` | undefined;
    originalProposalId: bigint;
}

export function useMilestoneRelease({ daoAddress, originalProposalId }: UseMilestoneReleaseProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    // تابع کمکی ساده برای انتخاب پیام خطا
    const getErrorMessage = (err: any) => {
        const message = err?.message || '';
        if (message.includes("Not authorized")) return t('toasts.error_not_authorized_milestone');
        if (message.includes("User rejected")) return t('toasts.error_user_rejected');
        return t('toasts.error_generic');
    };

    useEffect(() => {
        if (isSuccess) {
            toast.success(t('toasts.milestone_proposal_created'));
            setTimeout(() => router.push('/proposals'), 2000);
            setTxHash(undefined);
        }
        if (isError) {
            // ✅ استفاده مستقیم از ترجمه
            toast.error(getErrorMessage(error));
            setTxHash(undefined);
        }
    }, [isSuccess, isError, error, t, router]);

    const requestRelease = useCallback(async (proofDescription: string) => {
        if (!daoAddress) return;
        const toastId = toast.loading(t('toasts.submitting_milestone_release'));
        
        try {
            const proofHash = keccak256(toHex(proofDescription));
            const descriptionHash = keccak256(toHex(`Milestone Release: ${proofDescription}`));

            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'createMilestoneReleaseProposal',
                args: [originalProposalId, proofHash, descriptionHash],
            });
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastId });

        } catch (err) {
            toast.dismiss(toastId);
            // ✅ استفاده مستقیم از ترجمه
            toast.error(getErrorMessage(err));
        }
    }, [daoAddress, originalProposalId, writeContractAsync, t]);

    return {
        requestRelease,
        isreleasing: isSubmitting || isConfirming
    };
}