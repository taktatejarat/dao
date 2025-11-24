// src/hooks/useStaking.ts - FINAL, BULLETPROOF VERSION 2.0

"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { stakingAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, parseEther, isAddress, maxUint256 } from 'viem';
import { formatEther } from 'ethers';
import { useSWRConfig } from 'swr';

interface UseStakingProps {
    tokenAddress: Address | undefined;
    stakingAddress: Address | undefined;
}

export function useStaking({ tokenAddress, stakingAddress }: UseStakingProps) {
    const { t } = useTranslation();
    const { address, isConnected } = useAccount();
    const { mutate } = useSWRConfig(); // ✅ دریافت تابع mutate

    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [delegateeAddress, setDelegateeAddress] = useState<string>('');
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    const [currentAction, setCurrentAction] = useState<string | null>(null);

     // --- Data Fetching ---
    const contractsToRead = useMemo(() => [
        { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [address!] },
        { address: stakingAddress!, abi: stakingAbi, functionName: 'getStakedBalance', args: [address!] },
        { address: stakingAddress!, abi: stakingAbi, functionName: 'earned', args: [address!] },
        { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'allowance', args: [address!, stakingAddress!] },
        { address: stakingAddress!, abi: stakingAbi, functionName: 'delegates', args: [address!] },
    ], [tokenAddress, stakingAddress, address]);

    const { data: contractData, refetch } = useReadContracts({
        contracts: contractsToRead,
        query: { enabled: !!address && !!tokenAddress && !!stakingAddress && isConnected }
    });

    // قبلاً اگر یکی خطا می‌داد، همه چیز undefined می‌شد و لودینگ می‌ماند.
    const [rycBalance, stakedBalance, earnedRewards, allowance, currentDelegatee] = useMemo(() => {
        if (!contractData) return [undefined, undefined, undefined, undefined, undefined];

        // تابع کمکی برای استخراج ایمن داده
        const getVal = (index: number, defaultValue: any) => {
            const item = contractData[index];
            if (item && item.status === 'success') return item.result;
            return defaultValue;
        };

        return [
            getVal(0, 0n) as bigint, // اگر خطا داد، موجودی 0 فرض می‌شود
            getVal(1, 0n) as bigint,
            getVal(2, 0n) as bigint,
            getVal(3, 0n) as bigint,
            getVal(4, undefined) as Address | undefined, // آدرس نماینده می‌تواند undefined باشد
        ];
    }, [contractData]);

    const parsedStakeAmount = useMemo(() => { try { return parseEther(stakeAmount || '0'); } catch { return 0n; } }, [stakeAmount]);
    const parsedUnstakeAmount = useMemo(() => { try { return parseEther(unstakeAmount || '0'); } catch { return 0n; } }, [unstakeAmount]);
    const isValidDelegateeAddress = useMemo(() => isAddress(delegateeAddress) && delegateeAddress.toLowerCase() !== address?.toLowerCase(), [delegateeAddress, address]);
    const needsApproval = useMemo(() => (allowance ?? 0n) < parsedStakeAmount, [allowance, parsedStakeAmount]);

    // --- Transaction Logic ---
    const { isPending: isSubmitting, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

   useEffect(() => {
        if (!currentAction) return;
        if (isSuccess) {
            toast.success(t(`toasts.${currentAction}_successful`));
            
            //  THE CRITICAL FIX: استفاده از mutate برای refetch قدرتمند 
            // این دستور به SWR (و wagmi) می‌گوید که تمام query هایی که کلیدشان
            // با 'readContracts' شروع می‌شود را دوباره واکشی کند.
            mutate((key) => Array.isArray(key) && key[0] === 'readContracts');
            refetch(); // آپدیت دستی داده‌ها
            if (currentAction === 'stake') setStakeAmount('');
            if (currentAction === 'unstake') setUnstakeAmount('');
            setTxHash(undefined);
            setCurrentAction(null);
        }
        if (isError) {
            toast.error(t('toasts.transaction_failed'), { description: (error as BaseError)?.shortMessage || error?.message });
            setTxHash(undefined);
            setCurrentAction(null);
        }
    }, [isSuccess, isError, error, t, currentAction, mutate]);

    // NEW: A single, robust function to handle all transactions
    const executeTransaction = useCallback(async (
        action: string,
        config: Parameters<typeof writeContractAsync>[0]
    ) => {
        const toastId = toast.loading(t(`toasts.submitting_${action}`));
        setCurrentAction(action); // Set the current action for useEffect to track
        try {
            const hash = await writeContractAsync(config);
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastId });
        } catch (err) {
            toast.error(t('toasts.transaction_rejected'), { id: toastId, description: (err as BaseError).shortMessage });
            setCurrentAction(null); // Reset on rejection
        }
    }, [writeContractAsync, t]);

    // --- Action Handlers (Now using the robust executeTransaction function) ---
    const handleApprove = () => executeTransaction('approval', { address: tokenAddress!, abi: rayanChainTokenAbi, functionName: 'approve', args: [stakingAddress!, maxUint256] });
    const handleStake = () => executeTransaction('stake', { address: stakingAddress!, abi: stakingAbi, functionName: 'stake', args: [parsedStakeAmount] });
    const handleUnstake = () => executeTransaction('unstake', { address: stakingAddress!, abi: stakingAbi, functionName: 'unstake', args: [parsedUnstakeAmount] });
    const handleClaim = () => executeTransaction('claim', { address: stakingAddress!, abi: stakingAbi, functionName: 'claimReward', args: [] });
    const handleDelegate = () => executeTransaction('delegate', { address: stakingAddress!, abi: stakingAbi, functionName: 'delegate', args: [delegateeAddress as Address] });
    const handleUndelegate = () => executeTransaction('undelegate', { address: stakingAddress!, abi: stakingAbi, functionName: 'undelegate', args: [] });

    const isActionPending = isSubmitting || isConfirming;

    // --- Button Disabled Logic (Remains mostly the same, but more robust) ---
    const isApproveButtonDisabled = isActionPending || parsedStakeAmount <= 0n || (rycBalance != null && parsedStakeAmount > rycBalance);
    const isStakeButtonDisabled = isActionPending || parsedStakeAmount <= 0n || needsApproval || (rycBalance != null && parsedStakeAmount > rycBalance);
    const isUnstakeButtonDisabled = isActionPending || parsedUnstakeAmount <= 0n || (stakedBalance != null && parsedUnstakeAmount > stakedBalance);
    const isClaimButtonDisabled = isActionPending || (earnedRewards ?? 0n) <= 0n;
    const isDelegateButtonDisabled = isActionPending || !isValidDelegateeAddress || (stakedBalance ?? 0n) <= 0n;
    const isUndelegateButtonDisabled = isActionPending || !currentDelegatee || currentDelegatee === '0x0000000000000000000000000000000000000000';

    return {
        rycBalance, stakedBalance, earnedRewards, currentDelegatee,
        stakeAmount, setStakeAmount,
        unstakeAmount, setUnstakeAmount,
        delegateeAddress, setDelegateeAddress,
        needsApproval,
        isActionPending,
        handleApprove, handleStake, handleUnstake, handleClaim, handleDelegate, handleUndelegate,
        isApproveButtonDisabled,
        isStakeButtonDisabled,
        isUnstakeButtonDisabled,
        isClaimButtonDisabled,
        isDelegateButtonDisabled,
        isUndelegateButtonDisabled,
        refetch
    };
}