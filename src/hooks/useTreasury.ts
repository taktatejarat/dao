"use client";

import { useState, useEffect, useMemo } from 'react';
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

/**
 * A comprehensive custom hook to manage all treasury-related interactions,
 * including data fetching and handling deposits/withdrawals.
 */
export function useTreasury({ financeAddress, tokenAddress }: UseTreasuryProps) {
    const { t } = useTranslation();
    const { address } = useAccount();

    // --- Form State ---
    const [depositAmount, setDepositAmount] = useState('1000');
    const [withdrawRycAmount, setWithdrawRycAmount] = useState('');
    const [withdrawNativeAmount, setWithdrawNativeAmount] = useState('');

    // --- Data Fetching ---
    const { data: contractData, refetch } = useReadContracts({
        contracts: ([
            { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [financeAddress as Address] },
            { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [address as Address] },
        ] as any),
        query: { enabled: !!financeAddress && !!tokenAddress && !!address }
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
        try {
            const txHash = await writeContractAsync({
                address: tokenAddress!,
                abi: rayanChainTokenAbi,
                functionName: 'transfer',
                args: [financeAddress!, parsedDepositAmount],
            } as any);
            setSubmittedHash(txHash);
            toast.success(t('treasury_page.deposit_success'));
        } catch (err) {
            toast.error(t('treasury_page.deposit_error'));
        }
    };

    const handleWithdrawRyc = async () => {
        try {
            const txHash = await writeContractAsync({
                address: financeAddress!,
                abi: financeAbi,
                functionName: 'withdrawTokens',
                args: [parsedWithdrawRycAmount],
            } as any);
            setSubmittedHash(txHash);
            toast.success(t('treasury_page.withdraw_success'));
            setWithdrawRycAmount('');
        } catch (err) {
            toast.error(t('treasury_page.withdraw_error'));
        }
    };

    const handleWithdrawNative = async () => {
        try {
            const txHash = await writeContractAsync({
                address: financeAddress!,
                abi: financeAbi,
                functionName: 'withdraw',
                args: [parsedWithdrawNativeAmount],
            } as any);
            setSubmittedHash(txHash);
            toast.success(t('treasury_page.withdraw_success'));
            setWithdrawNativeAmount('');
        } catch (err) {
            toast.error(t('treasury_page.withdraw_error'));
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
        isDepositDisabled: parsedDepositAmount <= 0n || (adminRycBalance ? parsedDepositAmount > adminRycBalance : true),
        isWithdrawRycDisabled: parsedWithdrawRycAmount <= 0n || (rycTreasuryBalance ? parsedWithdrawRycAmount > rycTreasuryBalance : true),
        isWithdrawNativeDisabled: parsedWithdrawNativeAmount <= 0n || (nativeTreasuryBalance ? parsedWithdrawNativeAmount > nativeTreasuryBalance.value : true),
    };
}