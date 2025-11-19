// src/hooks/useTreasury.ts - FINAL, CORRECTED, AND ROBUST VERSION

"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { financeAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, parseEther } from 'viem';

interface UseTreasuryProps {
    financeAddress: Address | undefined;
    tokenAddress: Address | undefined;
}

export function useTreasury({ financeAddress, tokenAddress }: UseTreasuryProps) {
    const { t } = useTranslation();
    const { address: adminAddress } = useAccount(); // ✅ نام متغیر را برای خوانایی به adminAddress تغییر می‌دهیم

    // --- Form State ---
    const [depositAmount, setDepositAmount] = useState('1000');
    const [withdrawRycAmount, setWithdrawRycAmount] = useState('');
    const [withdrawNativeAmount, setWithdrawNativeAmount] = useState('');

    // --- Data Fetching ---
    const { data: contractData, refetch } = useReadContracts({
        contracts: ([
            { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [financeAddress as Address] },
            { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [adminAddress as Address] },
        ] as any),
        query: { enabled: !!financeAddress && !!tokenAddress && !!adminAddress }
    } as any);
    const { data: nativeTreasuryBalance, refetch: refetchNativeBalance } = useBalance({ address: financeAddress as Address, query: { enabled: !!financeAddress } });

    const [rycTreasuryBalance, adminRycBalance] = useMemo(() => {
        return contractData?.map(d => d.result as bigint | undefined) || [];
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

    // --- Transaction Hooks ---
    const { isPending, writeContractAsync } = useWriteContract();
    const [submittedHash, setSubmittedHash] = useState<`0x${string}` | undefined>(undefined);
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: submittedHash });

    useEffect(() => {
        if (isSuccess) {
            refetch();
            refetchNativeBalance();
        }
    }, [isSuccess, refetch, refetchNativeBalance]);

    // --- Action Handlers ---
   const handleDeposit = async () => {
        if (!tokenAddress || !financeAddress || !parsedDepositAmount) return;
        const toastId = 'deposit-toast';
        try {
            toast.loading(t('toasts.sending_transaction'), { id: toastId });
            const txHash = await writeContractAsync({
                address: tokenAddress,
                abi: rayanChainTokenAbi,
                functionName: 'transfer',
                // ✅ FIX: آرگومان‌ها صحیح هستند: (گیرنده، مقدار)
                args: [financeAddress, parsedDepositAmount],
            });
            setSubmittedHash(txHash);
            toast.success(t('toasts.tx_submitted'), { id: toastId });
            setDepositAmount('1000'); // ریست کردن فرم
        } catch (err) {
            toast.error(t('toasts.transaction_failed'), { id: toastId, description: (err as BaseError).shortMessage });
        }
    };

    const handleWithdrawRyc = async () => {
        if (!financeAddress || !adminAddress || !parsedWithdrawRycAmount) return;
        const toastId = 'withdraw-ryc-toast';
        try {
            toast.loading(t('toasts.sending_transaction'), { id: toastId });
            const txHash = await writeContractAsync({
                address: financeAddress,
                abi: financeAbi,
                functionName: 'withdrawTokens',
                // ✅✅✅ THE FIX: افزودن آرگومان 'to' (آدرس دریافت‌کننده) ✅✅✅
                args: [adminAddress, parsedWithdrawRycAmount],
            });
            setSubmittedHash(txHash);
            toast.success(t('toasts.tx_submitted'), { id: toastId });
            setWithdrawRycAmount('');
        } catch (err) {
            toast.error(t('toasts.transaction_failed'), { id: toastId, description: (err as BaseError).shortMessage });
        }
    };

    const handleWithdrawNative = async () => {
        if (!financeAddress || !adminAddress || !parsedWithdrawNativeAmount) return;
        const toastId = 'withdraw-native-toast';
        try {
            toast.loading(t('toasts.sending_transaction'), { id: toastId });
            const txHash = await writeContractAsync({
                address: financeAddress,
                abi: financeAbi,
                functionName: 'withdraw',
                // ✅✅✅ THE FIX: افزودن آرگومان 'to' (آدرس دریافت‌کننده) ✅✅✅
                args: [adminAddress, parsedWithdrawNativeAmount],
            });
            setSubmittedHash(txHash);
            toast.success(t('toasts.tx_submitted'), { id: toastId });
            setWithdrawNativeAmount('');
        } catch (err) {
            toast.error(t('toasts.transaction_failed'), { id: toastId, description: (err as BaseError).shortMessage });
        }
    };

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
        isActionPending: isPending || isConfirming,
        isDepositDisabled: parsedDepositAmount <= 0n || (adminRycBalance != null && parsedDepositAmount > adminRycBalance),
        isWithdrawRycDisabled: parsedWithdrawRycAmount <= 0n || (rycTreasuryBalance != null && parsedWithdrawRycAmount > rycTreasuryBalance),
        isWithdrawNativeDisabled: parsedWithdrawNativeAmount <= 0n || (nativeTreasuryBalance != null && parsedWithdrawNativeAmount > nativeTreasuryBalance.value),
    };
}