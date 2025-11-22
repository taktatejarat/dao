// src/hooks/useProposalExecute.ts (فایل جدید)

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
    proposalId: bigint | null; // ✅ می‌تواند null باشد اگر پروپوزال هنوز آن‌چین نشده
    isExecutable: boolean;
}

export function useProposalExecute({ daoAddress, proposalId, isExecutable }: UseProposalExecuteProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient(); // ✅ هوک برای دسترسی به کش wagmi/react-query

    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });


    // ✅✅✅ useEffect متمرکز برای مدیریت نتیجه نهایی تراکنش ✅✅✅
    useEffect(() => {
        if (!txHash) return;

        if (isSuccess) {
            toast.success(t('toasts.proposal_executed_successfully'));
            // ✅ CRITICAL: داده‌های مربوط به این پروپوزال را دوباره واکشی می‌کنیم
            // این کار باعث می‌شود UI (مثلاً وضعیت پروپوزال) بلافاصله آپدیت شود.
            queryClient.invalidateQueries({ queryKey: ['readContract', daoAddress, 'proposals', proposalId] });
            setTxHash(undefined); // ریست کردن برای تراکنش بعدی
        }

        if (isError) {
            toast.error(t('toasts.execution_failed'), { description: (error as BaseError)?.shortMessage || error?.message });
            setTxHash(undefined);
        }
    }, [isSuccess, isError, error, t, daoAddress, proposalId, queryClient]);

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
            setTxHash(hash); // ذخیره هش برای مانیتورینگ توسط useEffect
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastId });

        } catch (err) {
            // خطاهایی که قبل از ارسال تراکنش رخ می‌دهند (مثلاً رد کردن توسط کاربر)
            toast.error(t('toasts.transaction_rejected'), { id: toastId, description: (err as BaseError).shortMessage });
        }
    }, [isExecutable, daoAddress, proposalId, writeContractAsync, t]);

    return {
        handleExecute,
        isExecuting: isSubmitting || isConfirming,
    };
}