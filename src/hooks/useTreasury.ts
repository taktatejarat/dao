// src/hooks/useTreasury.ts - FINAL, BULLETPROOF VERSION

"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { financeAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, parseEther } from 'viem';
import { useQueryClient } from '@tanstack/react-query';

interface UseTreasuryProps {
    financeAddress: Address | undefined;
    tokenAddress: Address | undefined;
}

export function useTreasury({ financeAddress, tokenAddress }: UseTreasuryProps) {
    const { t } = useTranslation();
    const { address: adminAddress, isConnected } = useAccount();
    const queryClient = useQueryClient();

   // --- Form State ---
    const [depositAmount, setDepositAmount] = useState('1000');
    const [withdrawRycAmount, setWithdrawRycAmount] = useState('');
    const [withdrawNativeAmount, setWithdrawNativeAmount] = useState('');
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    const [currentAction, setCurrentAction] = useState<string | null>(null);

 
    // --- Data Fetching ---
    const { data: contractData } = useReadContracts({
        contracts: [
            { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [financeAddress!] },
            { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [adminAddress!] },
        ],
        query: { 
            enabled: !!financeAddress && !!tokenAddress && !!adminAddress && isConnected,
            refetchInterval: 15000, // به‌روزرسانی خودکار هر ۱۵ ثانیه
        }
    });
    const { data: nativeTreasuryBalance } = useBalance({ 
        address: financeAddress, 
        query: { 
            enabled: !!financeAddress && isConnected,
            refetchInterval: 15000,
        } 
    });

    const [rycTreasuryBalance, adminRycBalance] = useMemo(() => {
        if (!contractData || contractData.some(d => d.status === 'failure')) return [undefined, undefined];
        return contractData.map(d => d.result as bigint | undefined);
    }, [contractData]);

    // --- Derived State ---
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

   // ✅✅✅ useEffect متمرکز برای مدیریت نتیجه نهایی تراکنش ✅✅✅
    useEffect(() => {
        if (!currentAction) return;

        if (isSuccess) {
            toast.success(t(`toasts.${currentAction}_successful`));
            // ✅ CRITICAL: ما به جای refetch دستی، query ها را invalidate می‌کنیم
            // این روش استاندارد و بهینه در wagmi/react-query است
            queryClient.invalidateQueries({ queryKey: ['readContracts'] });
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            
            // ریست کردن state ها
            setTxHash(undefined);
            setCurrentAction(null);
        }

        if (isError) {
            toast.error(t('toasts.transaction_failed'), { description: (error as BaseError)?.shortMessage || error?.message });
            setTxHash(undefined);
            setCurrentAction(null);
        }
    }, [isSuccess, isError, error, queryClient, t, currentAction]);

        // ✅ تابع کمکی یکپارچه برای ارسال تراکنش
    const executeTransaction = useCallback(async (
        action: string,
        config: Parameters<typeof writeContractAsync>[0]
    ) => {
        const toastId = toast.loading(t(`toasts.submitting_${action}`));
        setCurrentAction(action);
        try {
            const hash = await writeContractAsync(config);
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastId });
        } catch (err) {
            toast.error(t('toasts.transaction_rejected'), { id: toastId, description: (err as BaseError).shortMessage });
            setCurrentAction(null);
        }
    }, [writeContractAsync, t]);


    // --- Action Handlers ---
    const handleDeposit = () => executeTransaction('deposit', { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'transfer', args: [financeAddress!, parsedDepositAmount] });
    const handleWithdrawRyc = () => executeTransaction('withdraw_ryc', { address: financeAddress!, abi: financeAbi, functionName: 'withdrawTokens', args: [adminAddress!, parsedWithdrawRycAmount] });
    const handleWithdrawNative = () => executeTransaction('withdraw_native', { address: financeAddress!, abi: financeAbi, functionName: 'withdraw', args: [adminAddress!, parsedWithdrawNativeAmount] });

    const isActionPending = isSubmitting || isConfirming;

    // --- Button Disabled Logic  ---
    const isDepositDisabled = isActionPending || parsedDepositAmount <= 0n || (adminRycBalance != null && parsedDepositAmount > adminRycBalance);
    const isWithdrawRycDisabled= parsedWithdrawRycAmount <= 0n || (rycTreasuryBalance != null && parsedWithdrawRycAmount > rycTreasuryBalance);
    const isWithdrawNativeDisabled= parsedWithdrawNativeAmount <= 0n || (nativeTreasuryBalance != null && parsedWithdrawNativeAmount > nativeTreasuryBalance.value);
    // ... (سایر متغیرهای disabled)

    return {
        // Balances
        rycTreasuryBalance,
        nativeTreasuryBalance,
        // Form State & Handlers
        depositAmount, setDepositAmount,
        withdrawRycAmount, setWithdrawRycAmount,
        withdrawNativeAmount, setWithdrawNativeAmount,
        // Actions
        handleDeposit,
        handleWithdrawRyc,
        handleWithdrawNative,
        // UI Logic
        isActionPending: isSubmitting || isConfirming,
        isDepositDisabled: isActionPending || parsedDepositAmount <= 0n || (adminRycBalance != null && parsedDepositAmount > adminRycBalance),
        isWithdrawRycDisabled: parsedWithdrawRycAmount <= 0n || (rycTreasuryBalance != null && parsedWithdrawRycAmount > rycTreasuryBalance),
        isWithdrawNativeDisabled: parsedWithdrawNativeAmount <= 0n || (nativeTreasuryBalance != null && parsedWithdrawNativeAmount > nativeTreasuryBalance.value),
    };
}