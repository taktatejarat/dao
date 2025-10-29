// src/hooks/useStaking.ts - FINAL, BULLETPROOF VERSION 2.0

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { stakingAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, parseEther, isAddress, maxUint256 } from 'viem';
import { formatEther } from 'ethers';

interface UseStakingProps {
    tokenAddress: Address | undefined;
    stakingAddress: Address | undefined;
}

export function useStaking({ tokenAddress, stakingAddress }: UseStakingProps) {
    const { t } = useTranslation();
    const { address, isConnected } = useAccount();

    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [delegateeAddress, setDelegateeAddress] = useState<string>('');

    const contractsToRead = useMemo(() => [
        { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [address!] },
        { address: stakingAddress as Address, abi: stakingAbi, functionName: 'getStakedBalance', args: [address!] },
        { address: stakingAddress as Address, abi: stakingAbi, functionName: 'earned', args: [address!] },
        { address: tokenAddress as Address, abi: rayanChainTokenAbi, functionName: 'allowance', args: [address!, stakingAddress!] },
        { address: stakingAddress as Address, abi: stakingAbi, functionName: 'delegates', args: [address!] },
    ], [tokenAddress, stakingAddress, address]);

    const { data: contractData, refetch } = useReadContracts({
        contracts: contractsToRead,
        query: { enabled: !!address && !!tokenAddress && !!stakingAddress && isConnected }
    });

    const [rycBalance, stakedBalance, earnedRewards, allowance, currentDelegatee] = useMemo(() => {
        if (!contractData) return [undefined, undefined, undefined, undefined, undefined];
        return [
            contractData[0].result as bigint | undefined,
            contractData[1].result as bigint | undefined,
            contractData[2].result as bigint | undefined,
            contractData[3].result as bigint | undefined,
            contractData[4].result as Address | undefined,
        ];
    }, [contractData]);

    const parsedStakeAmount = useMemo(() => { try { return parseEther(stakeAmount || '0'); } catch { return 0n; } }, [stakeAmount]);
    const parsedUnstakeAmount = useMemo(() => { try { return parseEther(unstakeAmount || '0'); } catch { return 0n; } }, [unstakeAmount]);
    const isValidDelegateeAddress = useMemo(() => isAddress(delegateeAddress) && delegateeAddress.toLowerCase() !== address?.toLowerCase(), [delegateeAddress, address]);
    
    const needsApproval = useMemo(() => {
        if (typeof allowance === 'undefined' || allowance === null) return false;
        if (parsedStakeAmount <= 0n) return false;
        return allowance < parsedStakeAmount;
    }, [allowance, parsedStakeAmount]);

    const { data: txHash, isPending, writeContractAsync, error, reset } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    useEffect(() => {
        if (isSuccess) {
            toast.success(t('staking_page.tx_success_title'));
            refetch();
            setStakeAmount('');
            setUnstakeAmount('');
            reset(); // Reset the hook state
        }
        if (error) {
            toast.error("Transaction Failed", { description: (error as BaseError).shortMessage || error.message });
            reset(); // Reset the hook state
        }
    }, [isSuccess, error, refetch, t, reset]);

    // ✅✅✅ THE FIX: Reverting to direct, type-safe calls instead of a generic handler ✅✅✅
    const handleApprove = async () => {
        if (!tokenAddress || !stakingAddress) {
            toast.error("Error", { description: "Contract addresses not loaded yet."});
            return;
        }
        try {
            await writeContractAsync({
                address: tokenAddress,
                abi: rayanChainTokenAbi,
                functionName: 'approve',
                args: [stakingAddress, maxUint256],
            });
            toast.info("Approval Submitted", { description: "Waiting for confirmation..." });
        } catch (err) { /* Error is handled by useEffect */ }
    };

    const handleStake = async () => {
        if (!stakingAddress) {
            toast.error("Error", { description: "Contract addresses not loaded yet."});
            return;
        }

        // ✅✅✅ DEBUGGING LOGS ✅✅✅
        console.log("--- Preparing Stake Transaction ---");
        console.log("Staking Contract Address:", stakingAddress);
        console.log("User's RYC Balance (from hook):", rycBalance ? formatEther(rycBalance) : 'Loading...');
        console.log("Amount to Stake (string):", stakeAmount);
        console.log("Amount to Stake (parsed bigint):", parsedStakeAmount.toString());
        console.log("Current Allowance:", allowance ? formatEther(allowance) : 'Loading...');
        console.log("Needs Approval?:", needsApproval);

        if (rycBalance && parsedStakeAmount > rycBalance) {
            toast.error("Error: Insufficient Balance", { description: `You are trying to stake ${stakeAmount} RYC, but you only have ${formatEther(rycBalance)}.`});
            console.error("Stake amount exceeds balance!");
            return;
        }
        // ✅✅✅ END DEBUGGING LOGS ✅✅✅

        try {
            await writeContractAsync({
                address: stakingAddress,
                abi: stakingAbi,
                functionName: 'stake',
                args: [parsedStakeAmount],
            });
            toast.info("Stake Submitted", { description: "Waiting for confirmation..." });
        } catch (err) { /* Error is handled by useEffect */ }
    };

    // ... (All other handlers follow the same direct-call pattern)
    const handleUnstake = async () => {
        if (!stakingAddress) return;
        try { await writeContractAsync({ address: stakingAddress, abi: stakingAbi, functionName: 'unstake', args: [parsedUnstakeAmount] }); toast.info("Unstake Submitted"); } catch(e) {}
    };
    const handleClaim = async () => {
        if (!stakingAddress) return;
        try { await writeContractAsync({ address: stakingAddress, abi: stakingAbi, functionName: 'claimReward', args: [] }); toast.info("Claim Submitted"); } catch(e) {}
    };
    const handleDelegate = async () => {
        if (!stakingAddress || !isValidDelegateeAddress) return;
        try { await writeContractAsync({ address: stakingAddress, abi: stakingAbi, functionName: 'delegate', args: [delegateeAddress as Address] }); toast.info("Delegate Submitted"); } catch(e) {}
    };
    const handleUndelegate = async () => {
        if (!stakingAddress) return;
        try { await writeContractAsync({ address: stakingAddress, abi: stakingAbi, functionName: 'undelegate', args: [] }); toast.info("Undelegate Submitted"); } catch(e) {}
    };

    const isActionPending = isPending || isConfirming;
    const isApproveButtonDisabled = isActionPending || parsedStakeAmount <= 0n || (rycBalance ? parsedStakeAmount > rycBalance : true);
    const isStakeButtonDisabled = isActionPending || parsedStakeAmount <= 0n || (rycBalance ? parsedStakeAmount > rycBalance : true) || needsApproval;
    const isUnstakeButtonDisabled = isActionPending || parsedUnstakeAmount <= 0n || (stakedBalance ? parsedUnstakeAmount > stakedBalance : true);
    const isClaimButtonDisabled = isActionPending || !earnedRewards || earnedRewards <= 0n;
    const isDelegateButtonDisabled = isActionPending || !isValidDelegateeAddress || !stakedBalance || stakedBalance <= 0n;
    const isUndelegateButtonDisabled = isActionPending || !currentDelegatee || currentDelegatee === '0x0000000000000000000000000000000000000000' || currentDelegatee === address;

    return {
        rycBalance, stakedBalance, earnedRewards, currentDelegatee,
        stakeAmount, setStakeAmount,
        unstakeAmount, setUnstakeAmount,
        delegateeAddress, setDelegateeAddress,
        needsApproval,
        isActionPending,
        handleApprove, handleStake, handleUnstake, handleClaim, handleDelegate, handleUndelegate,
        refetch,
        isApproveButtonDisabled,
        isStakeButtonDisabled,
        isUnstakeButtonDisabled,
        isClaimButtonDisabled,
        isDelegateButtonDisabled,
        isUndelegateButtonDisabled,
    };
}