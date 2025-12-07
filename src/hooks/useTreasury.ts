// src/hooks/useTreasury.ts - FINAL FIX FOR TOASTS AND REFRESH

"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { financeAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, parseEther } from 'viem';

interface UseTreasuryProps {
    financeAddress: Address | undefined;
    tokenAddress: Address | undefined;
    onSuccess?: () => void; // ✅ اضافه شد: تابعی برای رفرش کردن صفحه والد
}

export function useTreasury({ financeAddress, tokenAddress, onSuccess }: UseTreasuryProps) {
    const { t } = useTranslation();
    const { address: adminAddress, isConnected } = useAccount();

    // --- Form State ---
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawRycAmount, setWithdrawRycAmount] = useState('');
    const [withdrawNativeAmount, setWithdrawNativeAmount] = useState('');
    
    // --- Transaction State ---
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    const [currentAction, setCurrentAction] = useState<string | null>(null);
    const [toastId, setToastId] = useState<string | number | undefined>(undefined); // ✅ ذخیره ID پیام

    // --- Data Fetching (Local for Validation) ---
    const { data: contractData, refetch: refetchLocal } = useReadContracts({
        contracts: [
            { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [financeAddress!] },
            { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [adminAddress!] },
        ],
        query: { enabled: !!financeAddress && !!tokenAddress && !!adminAddress && isConnected }
    });
    
    const { data: nativeTreasuryBalance, refetch: refetchNative } = useBalance({ 
        address: financeAddress, 
        query: { enabled: !!financeAddress && isConnected } 
    });

    const [rycTreasuryBalance, adminRycBalance] = useMemo(() => {
        if (!contractData || contractData.some(d => d.status === 'failure')) return [undefined, undefined];
        return contractData.map(d => d.result as bigint | undefined);
    }, [contractData]);

    const parsedDepositAmount = useMemo(() => {
        try { return parseEther(depositAmount || '0'); } catch { return 0n; }
    }, [depositAmount]);
    
    const parsedWithdrawRycAmount = useMemo(() => {
        try { return parseEther(withdrawRycAmount || '0'); } catch { return 0n; }
    }, [withdrawRycAmount]);
    
    const parsedWithdrawNativeAmount = useMemo(() => {
        try { return parseEther(withdrawNativeAmount || '0'); } catch { return 0n; }
    }, [withdrawNativeAmount]);

    // --- Transaction Logic ---
    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    // ✅ مدیریت پیام‌ها و رفرش دیتا
    useEffect(() => {
        if (!currentAction || !toastId) return;

        if (isSuccess) {
            // ✅ آپدیت همان پیام قبلی به موفقیت
            toast.success(t(`toasts.${currentAction}_successful`), { id: toastId });
            
            // ✅ رفرش کردن داده‌ها
            refetchLocal();
            refetchNative();
            if (onSuccess) onSuccess(); // اطلاع به کامپوننت والد برای رفرش

            // پاکسازی
            setTxHash(undefined);
            setCurrentAction(null);
            setToastId(undefined);
            
            // خالی کردن فرم‌ها در صورت نیاز
            if (currentAction === 'deposit') setDepositAmount('');
            if (currentAction.includes('withdraw')) {
                setWithdrawRycAmount('');
                setWithdrawNativeAmount('');
            }
        }

        if (isError) {
            // ✅ آپدیت همان پیام قبلی به خطا
            const errorMsg = (error as BaseError)?.shortMessage || error?.message || "Unknown error";
            toast.error(t('toasts.transaction_failed'), { 
                id: toastId, 
                description: errorMsg 
            });
            
            setTxHash(undefined);
            setCurrentAction(null);
            setToastId(undefined);
        }
    }, [isSuccess, isError, error, t, currentAction, toastId, refetchLocal, refetchNative, onSuccess]);

    const executeTransaction = useCallback(async (
        action: string,
        config: Parameters<typeof writeContractAsync>[0]
    ) => {
        // ✅ ذخیره ID پیام برای استفاده بعدی
        const id = toast.loading(t(`toasts.submitting_${action}`));
        setToastId(id);
        setCurrentAction(action);
        
        try {
            const hash = await writeContractAsync(config);
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: id }); // آپدیت متن پیام
        } catch (err) {
            toast.error(t('toasts.transaction_rejected'), { 
                id: id, 
                description: (err as BaseError).shortMessage 
            });
            setCurrentAction(null);
            setToastId(undefined);
        }
    }, [writeContractAsync, t]);

    // Handlers
    const handleDeposit = () => executeTransaction('deposit', { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'transfer', args: [financeAddress!, parsedDepositAmount] });
    const handleWithdrawRyc = () => executeTransaction('withdraw_ryc', { address: financeAddress!, abi: financeAbi, functionName: 'withdrawTokens', args: [adminAddress!, parsedWithdrawRycAmount] });
    const handleWithdrawNative = () => executeTransaction('withdraw_native', { address: financeAddress!, abi: financeAbi, functionName: 'withdraw', args: [adminAddress!, parsedWithdrawNativeAmount] });

    const isActionPending = isSubmitting || isConfirming;

    const isDepositDisabled = isActionPending || parsedDepositAmount <= 0n || (adminRycBalance != null && parsedDepositAmount > adminRycBalance);
    const isWithdrawRycDisabled = parsedWithdrawRycAmount <= 0n || (rycTreasuryBalance != null && parsedWithdrawRycAmount > rycTreasuryBalance);
    const isWithdrawNativeDisabled = parsedWithdrawNativeAmount <= 0n || (nativeTreasuryBalance != null && parsedWithdrawNativeAmount > nativeTreasuryBalance.value);

    return {
        rycTreasuryBalance,
        nativeTreasuryBalance,
        depositAmount, setDepositAmount,
        withdrawRycAmount, setWithdrawRycAmount,
        withdrawNativeAmount, setWithdrawNativeAmount,
        handleDeposit,
        handleWithdrawRyc,
        handleWithdrawNative,
        isActionPending,
        isDepositDisabled,
        isWithdrawRycDisabled,
        isWithdrawNativeDisabled,
    };
}