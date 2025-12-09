// src/hooks/useStaking.ts

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { stakingAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { parseEther, isAddress, maxUint256 } from 'viem';
import { useSWRConfig } from 'swr';

interface UseStakingProps {
    tokenAddress: Address | undefined;
    stakingAddress: Address | undefined;
}

export function useStaking({ tokenAddress, stakingAddress }: UseStakingProps) {
    const { t } = useTranslation();
    const { address, isConnected } = useAccount();
    const { mutate } = useSWRConfig();

    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [delegateeAddress, setDelegateeAddress] = useState<string>('');
    
    // مدیریت تراکنش
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    const [currentAction, setCurrentAction] = useState<string | null>(null);
    const toastIdRef = useRef<string | number | null>(null);

    // --- 1. Data Fetching ---
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

    const [rycBalance, stakedBalance, earnedRewards, allowance, currentDelegatee] = useMemo(() => {
        const getVal = (index: number, defaultValue: any) => {
            if (!contractData || !contractData[index]) return defaultValue;
            const item = contractData[index];
            if (item.status === 'success') return item.result;
            return defaultValue;
        };

        return [
            getVal(0, 0n) as bigint,
            getVal(1, 0n) as bigint,
            getVal(2, 0n) as bigint,
            getVal(3, 0n) as bigint,
            getVal(4, undefined) as Address | undefined,
        ];
    }, [contractData]);

    const parsedStakeAmount = useMemo(() => { try { return parseEther(stakeAmount || '0'); } catch { return 0n; } }, [stakeAmount]);
    const parsedUnstakeAmount = useMemo(() => { try { return parseEther(unstakeAmount || '0'); } catch { return 0n; } }, [unstakeAmount]);
    const isValidDelegateeAddress = useMemo(() => isAddress(delegateeAddress), [delegateeAddress]);
    const needsApproval = useMemo(() => (allowance ?? 0n) < parsedStakeAmount, [allowance, parsedStakeAmount]);

    // --- 2. Transaction Execution ---
    const { writeContractAsync, isPending: isWritePending, reset: resetWrite } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash: txHash });

    const resetState = useCallback(() => {
        setTxHash(undefined);
        setCurrentAction(null);
        resetWrite(); 
        toastIdRef.current = null;
    }, [resetWrite]);

    useEffect(() => {
        if (!currentAction) return;

        if (isSuccess) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.success(t(`toasts.${currentAction}_successful`));
            
            if (currentAction === 'stake') setStakeAmount('');
            if (currentAction === 'unstake') setUnstakeAmount('');
            if (currentAction.includes('delegate')) setDelegateeAddress('');

            // آپدیت با تأخیر
            setTimeout(() => {
                mutate((key) => Array.isArray(key) && key[0] === 'readContracts');
                refetch();
            }, 2000);

            resetState();
        }

        if (isError) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            const msg = (error as any)?.shortMessage || error?.message || "Unknown error";
            toast.error(t('toasts.transaction_failed'), { description: msg.slice(0, 100) });
            resetState();
        }
    }, [isSuccess, isError, error, t, currentAction, mutate, refetch, resetState]);

    // ✅ تابع هندلر اصلی (Approve & Stake) با Gas Limit بالا
    const handleStake = async () => {
        if (!tokenAddress || !stakingAddress) {
            console.error("❌ Addresses missing:", { tokenAddress, stakingAddress });
            toast.error("Contract addresses missing. Refresh page.");
            return;
        }

        // --- STEP 1: APPROVE ---
        if (needsApproval) {
            toastIdRef.current = toast.loading(t('toasts.submitting_approval'));
            setCurrentAction('approval');
            
            console.log("🚀 Sending Approve TX:", {
                token: tokenAddress,
                spender: stakingAddress,
                amount: maxUint256.toString()
            });

            try {
                const hash = await writeContractAsync({
                    address: tokenAddress,
                    abi: rayanChainTokenAbi,
                    functionName: 'approve',
                    args: [stakingAddress, maxUint256],
                    // ⚠️ افزایش قابل توجه Gas Limit برای جلوگیری از خطای -32603
                    gas: BigInt(500000), 
                });
                console.log("✅ Approve TX Sent. Hash:", hash);
                setTxHash(hash);
                toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
            } catch (err: any) {
                console.error("❌ Approve Error:", err);
                if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                // نمایش دقیق‌تر خطا
                const msg = err.details || err.shortMessage || err.message;
                toast.error(t('common.error'), { description: msg });
                resetState();
            }
            return;
        }

        // --- STEP 2: STAKE ---
        toastIdRef.current = toast.loading(t('toasts.submitting_stake'));
        setCurrentAction('stake');
        
        console.log("🚀 Sending Stake TX:", {
            contract: stakingAddress,
            amount: parsedStakeAmount.toString()
        });

        try {
            const hash = await writeContractAsync({
                address: stakingAddress,
                abi: stakingAbi,
                functionName: 'stake',
                args: [parsedStakeAmount],
                // ⚠️ افزایش Gas Limit برای تابع Stake که سنگین‌تر است
                gas: BigInt(1000000), 
            });
            console.log("✅ Stake TX Sent. Hash:", hash);
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
        } catch (err: any) {
            console.error("❌ Stake Error:", err);
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            const msg = err.details || err.shortMessage || err.message;
            toast.error(t('common.error'), { description: msg });
            resetState();
        }
    };

    // سایر هندلرها (ساده شده)
    const executeTransaction = useCallback(async (action: string, config: any) => {
        toastIdRef.current = toast.loading(t(`toasts.submitting_${action}`));
        setCurrentAction(action); 
        try {
            const hash = await writeContractAsync({ ...config, gas: BigInt(250000) }); 
            setTxHash(hash);
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
        } catch (err: any) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(t('common.error'), { description: err.shortMessage || err.message });
            resetState();
        }
    }, [writeContractAsync, t, resetState]);

    const handleUnstake = () => executeTransaction('unstake', { address: stakingAddress!, abi: stakingAbi, functionName: 'unstake', args: [parsedUnstakeAmount] });
    const handleClaim = () => executeTransaction('claim', { address: stakingAddress!, abi: stakingAbi, functionName: 'claimReward', args: [] });
    
    const handleDelegate = () => {
        if (delegateeAddress.toLowerCase() === address?.toLowerCase()) {
            return executeTransaction('undelegate', { address: stakingAddress!, abi: stakingAbi, functionName: 'undelegate', args: [] });
        }
        return executeTransaction('delegate', { address: stakingAddress!, abi: stakingAbi, functionName: 'delegate', args: [delegateeAddress as Address] });
    };
    const handleUndelegate = () => executeTransaction('undelegate', { address: stakingAddress!, abi: stakingAbi, functionName: 'undelegate', args: [] });

    const isActionPending = isWritePending || isConfirming;

    // Button States
    const isApproveButtonDisabled = isActionPending || parsedStakeAmount <= 0n;
    const isStakeButtonDisabled = isActionPending || parsedStakeAmount <= 0n;
    const isUnstakeButtonDisabled = isActionPending || parsedUnstakeAmount <= 0n;
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
        handleStake, 
        handleUnstake, handleClaim, handleDelegate, handleUndelegate,
        isApproveButtonDisabled, isStakeButtonDisabled, isUnstakeButtonDisabled, isClaimButtonDisabled, isDelegateButtonDisabled, isUndelegateButtonDisabled,
        refetch 
    };
}