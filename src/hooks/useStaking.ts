"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContracts, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { stakingAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, parseEther, isAddress, maxUint256 } from 'viem';


interface UseStakingProps {
    tokenAddress: Address | undefined;
    stakingAddress: Address | undefined;
}

export function useStaking({ tokenAddress, stakingAddress }: UseStakingProps) {
    const { t } = useTranslation();
    const { address } = useAccount();

    // --- Form State ---
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [delegateeAddress, setDelegateeAddress] = useState<string>(''); 

    // --- Data Fetching ---
    const { data: contractData, refetch } = useReadContracts({
        contracts: [
            { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [address as Address] as const },
            { address: stakingAddress as Address, abi: stakingAbi, functionName: 'balanceOf', args: [address as Address] as const },
            { address: stakingAddress as Address, abi: stakingAbi, functionName: 'earned', args: [address as Address] as const },
            { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'allowance', args: [address as Address, stakingAddress as Address] as const },
        ] as const,
        query: { enabled: !!address && !!tokenAddress && !!stakingAddress }
    } as any);

    const { data: delegateeAddressResult } = useReadContract({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: 'delegates',
        args: [address as Address],
        query: { enabled: !!address && !!stakingAddress }
    });

    const [rycBalance, stakedBalance, earnedRewards, allowance] = useMemo(() => {
        return contractData?.map(d => d.result as bigint | undefined) || [];
    }, [contractData]);
    
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
    const { data: txHash, isPending, writeContractAsync } = useWriteContract();
    const [submittedHash, setSubmittedHash] = useState<`0x${string}` | undefined>(undefined);
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: submittedHash });

   useEffect(() => {
        if (isSuccess) {
            refetch();
            toast.success(t('staking_page.tx_success_title'), { description: t('staking_page.tx_success_desc') });
        }
    }, [isSuccess, refetch, t]);

    // --- Action Handlers ---
    const extractRevertReason = (err: unknown): string => {
        const baseError = err as BaseError;
        const revertMatch = baseError?.shortMessage?.match(/reverted with the following reason: (.*)\.?/);
        if (revertMatch && revertMatch[1]) {
            return revertMatch[1];
        }
        return baseError?.shortMessage || t('new_proposal.unexpected_error_desc');
    };

    const handleApprove = async () => {
        if (!tokenAddress || !stakingAddress) {
            toast.error(t('new_proposal.error_toast_title'), { description: t('staking_page.contract_addresses_missing') });
            return;
        }
        try {
            const hash = await writeContractAsync({
                address: tokenAddress,
                abi: rayanChainTokenAbi,
                functionName: 'approve',
                args: [stakingAddress, maxUint256],
            } as any);
            setSubmittedHash(hash);
            toast.info(t('new_proposal.pending_toast_title'), { description: t('staking_page.approve_in_progress') }); 
        } catch (err) {
            toast.error(t('new_proposal.error_toast_title'), { description: extractRevertReason(err) });
        }
    };

 const handleStake = async () => {
        // ✅ FIX 1: Explicit Null/Undefined Check
        if (!stakingAddress) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: t('staking_page.contract_addresses_missing') });
            return;
        }
        try {
            const txHash = await writeContractAsync({
                address: stakingAddress,
                abi: stakingAbi,
                functionName: 'stake',
                args: [parsedStakeAmount],
            } as any);
            setSubmittedHash(txHash);
            toast.info(t('new_proposal_page.pending_toast_title'), { description: txHash });
            setStakeAmount('');
        } catch (err) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: extractRevertReason(err) });
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
            toast.info(t('new_proposal_page.pending_toast_title'), { description: txHash });
            setUnstakeAmount('');
        } catch (err) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: extractRevertReason(err) });
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
            toast.info(t('new_proposal_page.pending_toast_title'), { description: txHash });
        } catch (err) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: extractRevertReason(err) });
        }
    };
    
  const handleDelegate = async () => {
        // ✅ FIX 1: Explicit Null/Undefined Check
        if (!stakingAddress) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: t('staking_page.contract_addresses_missing') });
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
            toast.info(t('new_proposal_page.pending_toast_title'), { description: txHash });
        } catch (err) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: extractRevertReason(err) });
        }
    };
    
    const handleUndelegate = async () => {
        try {
            const txHash = await writeContractAsync({
                address: stakingAddress!,
                abi: stakingAbi,
                functionName: 'undelegate',
                args: [],
            } as any);
            setSubmittedHash(txHash);
            toast.info(t('new_proposal_page.pending_toast_title'), { description: txHash });
        } catch (err) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: extractRevertReason(err) });
        }
    };

     return {
        rycBalance,
        stakedBalance,
        earnedRewards,
        currentDelegatee,
        stakeAmount,
        setStakeAmount,
        unstakeAmount,
        setUnstakeAmount,
        delegateeAddress,
        setDelegateeAddress,
        needsApproval,
        isActionPending: isPending || isConfirming,
        handleApprove,
        handleStake,
        handleUnstake,
        handleClaim,
        handleDelegate,
        handleUndelegate,
        isStakeButtonDisabled: parsedStakeAmount <= 0n || isPending || isConfirming,
        isUnstakeButtonDisabled: parsedUnstakeAmount <= 0n || (stakedBalance ? parsedUnstakeAmount > stakedBalance : true) || isPending || isConfirming,
        isClaimButtonDisabled: !(earnedRewards && earnedRewards > 0n) || isPending || isConfirming,
        isDelegateButtonDisabled: !isValidDelegateeAddress || isPending || isConfirming || currentDelegatee === delegateeAddress as Address,
        isUndelegateButtonDisabled: currentDelegatee === undefined || currentDelegatee === '0x0000000000000000000000000000000000000000' || isPending || isConfirming,
    };
}