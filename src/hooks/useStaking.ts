// src/hooks/useStaking.ts - Revised for dPoS

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContracts, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { stakingAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, parseEther, isAddress } from 'viem';

interface UseStakingProps {
    tokenAddress: Address | undefined;
    stakingAddress: Address | undefined;
}

/**
 * A comprehensive custom hook to manage all staking-related logic,
 * including data fetching, approvals, staking, unstaking, and claiming rewards,
 * now including dPoS Delegation.
 */
export function useStaking({ tokenAddress, stakingAddress }: UseStakingProps) {
    const { t } = useTranslation();
    const { address } = useAccount();

    // --- Form State ---
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [delegateeAddress, setDelegateeAddress] = useState<string>(''); // New State for Delegatee

    // --- Data Fetching ---
    const { data: contractData, refetch } = useReadContracts({
        contracts: [
            // 0: RYC Balance
            { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [address as Address] as const },
            // 1: Staked Balance (Own Stake) - We need the *actual* staked balance for staking/unstaking logic
            { address: stakingAddress as Address, abi: stakingAbi, functionName: 'balanceOf', args: [address as Address] as const },
            // 2: Earned Rewards
            { address: stakingAddress as Address, abi: stakingAbi, functionName: 'earned', args: [address as Address] as const },
            // 3: Allowance
            { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'allowance', args: [address as Address, stakingAddress as Address] as const },
        ] as const,
        query: {
            enabled: !!address && !!tokenAddress && !!stakingAddress,
        }
    } as any);

    const { data: delegateeAddressResult } = useReadContract({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: 'delegates',
        args: [address as Address],
        query: { enabled: !!address && !!stakingAddress }
    });

    const [rycBalance, stakedBalance, earnedRewards, allowance] = useMemo(() => {
        // index 1 is now the user's *actual* staked balance (for unstaking check)
        return contractData?.map(d => d.result as bigint | undefined) || [];
    }, [contractData]);
    
    // The address the user has delegated to (address(0) if none)
    const currentDelegatee = delegateeAddressResult as Address | undefined;

    // --- Derived State from Form Inputs ---
    const parsedStakeAmount = useMemo(() => {
        try { return parseEther(stakeAmount || '0'); } catch { return 0n; }
    }, [stakeAmount]);

    const parsedUnstakeAmount = useMemo(() => {
        try { return parseEther(unstakeAmount || '0'); } catch { return 0n; }
    }, [unstakeAmount]);

    const needsApproval = useMemo(() => {
        return !!allowance && allowance < parsedStakeAmount;
    }, [allowance, parsedStakeAmount]);
    
    const isValidDelegateeAddress = useMemo(() => {
        return isAddress(delegateeAddress) && delegateeAddress.toLowerCase() !== address?.toLowerCase();
    }, [delegateeAddress, address]);


    // --- Transaction Hooks ---
    const { isPending, writeContractAsync } = useWriteContract();
    const [submittedHash, setSubmittedHash] = useState<`0x${string}` | undefined>(undefined);
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: submittedHash });

    useEffect(() => {
        if (isSuccess) {
            refetch();
        }
    }, [isSuccess, refetch]);

    // --- Action Handlers ---
    const handleApprove = async () => {
        try {
            const txHash = await writeContractAsync({
                address: tokenAddress!,
                abi: rayanChainTokenAbi,
                functionName: 'approve',
                args: [stakingAddress!, parsedStakeAmount],
            } as any);
            setSubmittedHash(txHash);
            toast.info(t('staking_page.approve_pending'));
        } catch (err) {
            toast.error(t('staking_page.approve_error'));
        }
    };

    const handleStake = async () => {
        try {
            const txHash = await writeContractAsync({
                address: stakingAddress!,
                abi: stakingAbi,
                functionName: 'stake',
                args: [parsedStakeAmount],
            } as any);
            setSubmittedHash(txHash);
            toast.success(t('staking_page.stake_success'));
            setStakeAmount('');
        } catch (err) {
            toast.error(t('staking_page.stake_error'));
        }
    };

    const handleUnstake = async () => {
        try {
            const txHash = await writeContractAsync({
                address: stakingAddress!,
                abi: stakingAbi,
                functionName: 'unstake',
                args: [parsedUnstakeAmount],
            } as any);
            setSubmittedHash(txHash);
            toast.success(t('staking_page.unstake_success'));
            setUnstakeAmount('');
        } catch (err) {
            toast.error(t('staking_page.unstake_error'));
        }
    };

    const handleClaim = async () => {
        try {
            const txHash = await writeContractAsync({
                address: stakingAddress!,
                abi: stakingAbi,
                functionName: 'claimReward',
            } as any);
            setSubmittedHash(txHash);
            toast.success(t('staking_page.claim_success'));
        } catch (err) {
            toast.error(t('staking_page.claim_error'));
        }
    };
    // ✅ NEW: Delegate Handler
    const handleDelegate = async () => {
        if (!isValidDelegateeAddress) {
            toast.error(t('staking_page.delegate_error_title'), { description: t('staking_page.invalid_delegatee_desc') });
            return;
        }
        
        try {
            const txHash = await writeContractAsync({
                address: stakingAddress!,
                abi: stakingAbi,
                functionName: 'delegate',
                args: [delegateeAddress as Address],
            } as any);
            setSubmittedHash(txHash);
            toast.success(t('staking_page.delegate_success'));
        } catch (err) {
            toast.error(t('staking_page.delegate_error'));
        }
    };
    
    // ✅ NEW: Undelegate Handler
    const handleUndelegate = async () => {
        try {
            const txHash = await writeContractAsync({
                address: stakingAddress!,
                abi: stakingAbi,
                functionName: 'undelegate',
                args: [],
            } as any);
            setSubmittedHash(txHash);
            toast.success(t('staking_page.undelegate_success'));
        } catch (err) {
            toast.error(t('staking_page.undelegate_error'));
        }
    };


    return {
        // State
        rycBalance,
        stakedBalance,
        earnedRewards,
        currentDelegatee, // New State
        stakeAmount,
        setStakeAmount,
        unstakeAmount,
        setUnstakeAmount,
        delegateeAddress, // New State
        setDelegateeAddress, // New State
        needsApproval,
        isActionPending: isPending || isConfirming,
        
        // Actions
        handleApprove,
        handleStake,
        handleUnstake,
        handleClaim,
        handleDelegate, // New Action
        handleUndelegate, // New Action

        // UI Logic
        isStakeButtonDisabled: parsedStakeAmount <= 0n || isPending || isConfirming,
        isUnstakeButtonDisabled: parsedUnstakeAmount <= 0n || (stakedBalance ? parsedUnstakeAmount > stakedBalance : true) || isPending || isConfirming,
        isClaimButtonDisabled: !(earnedRewards && earnedRewards > 0n) || isPending || isConfirming,
        isDelegateButtonDisabled: !isValidDelegateeAddress || isPending || isConfirming || currentDelegatee === delegateeAddress as Address, // New Logic
        isUndelegateButtonDisabled: currentDelegatee === undefined || currentDelegatee === '0x0000000000000000000000000000000000000000' || isPending || isConfirming, // New Logic
    };
}