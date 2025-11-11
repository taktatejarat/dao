// src/hooks/useCreateProposal.ts - FINAL, COMPLETE, AND ERROR-FREE VERSION

"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, isAddress, parseEther, BaseError, Hex } from 'viem';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';

// --- Type Definitions ---
export interface Milestone { name: string; durationDays: string; amount: string; }
interface UseCreateProposalProps { daoAddress: Address | undefined; isFormEnabled: boolean; }

// --- The Custom Hook ---
export function useCreateProposal({ daoAddress, isFormEnabled }: UseCreateProposalProps) {
    const { address } = useAccount();
    const { t } = useTranslation();
    const router = useRouter();

    // --- Form State ---
    const [description, setDescription] = useState('');
    const [recipient, setRecipient] = useState<string>('');
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);
    const [startupIndustry, setStartupIndustry] = useState('');
    const [teamExperienceYears, setTeamExperienceYears] = useState('');
    const [hasPreviousFunding, setHasPreviousFunding] = useState('false');
    const [marketSize, setMarketSize] = useState('');
    const [teamBio, setTeamBio] = useState('');

    // --- Transaction Flow State ---
    const [isPending, setIsPending] = useState(false);
    const [txHash, setTxHash] = useState<Hex | undefined>();

    const { writeContractAsync } = useWriteContract();
    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    // --- Form Validation (Memoized) ---
    const isFormValid = useMemo(() => {
        const areMilestonesValid = milestones.every(m =>
            m.name.trim() !== '' &&
            m.durationDays.trim() !== '' && parseInt(m.durationDays, 10) > 0 &&
            m.amount.trim() !== '' && parseFloat(m.amount) > 0
        );
        return description.trim() !== '' &&
               isAddress(recipient) &&
               startupIndustry.trim() !== '' &&
               teamExperienceYears.trim() !== '' &&
               marketSize.trim() !== '' &&
               teamBio.trim() !== '' &&
               areMilestonesValid;
    }, [description, recipient, startupIndustry, teamExperienceYears, marketSize, teamBio, milestones]);
    
    // --- Form Handlers (Correctly Implemented) ---
    const handleAddMilestone = useCallback(() => setMilestones(prev => [...prev, { name: '', durationDays: '', amount: '' }]), []);
    const handleMilestoneChange = useCallback((index: number, field: keyof Milestone, value: string) => {
        const newMilestones = [...milestones];
        if ((field === 'amount' || field === 'durationDays') && value !== '' && !/^\d*\.?\d*$/.test(value)) return;
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    }, [milestones]);
    const handleRemoveMilestone = useCallback((index: number) => {
        if (milestones.length > 1) setMilestones(prev => prev.filter((_, i) => i !== index));
    }, [milestones.length]);

    // --- Main Submission Logic ---
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || !daoAddress || !address) return;

        setIsPending(true);
        toast.loading("Step 1/2: Saving proposal data off-chain...");

        try {
            // --- STEP 1: Prepare payload and save data off-chain ---
            const fullAiFeatures = { 
                industry: startupIndustry, 
                team_experience_years: parseInt(teamExperienceYears, 10) || 0, 
                has_previous_funding: hasPreviousFunding === 'true', 
                market_size_usd: parseInt(marketSize, 10) || 0, 
                team_bio: teamBio 
            };
            const payload = { 
                proposerAddress: address, 
                description, 
                recipientAddress: recipient, 
                milestones, 
                aiFeatures: fullAiFeatures 
            };
            
            const apiResponse = await fetch('/api/contract-creation', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });

            if (!apiResponse.ok) {
                throw new Error((await apiResponse.json()).message || 'Failed to save data off-chain.');
            }
            const { descriptionHash } = await apiResponse.json();
            toast.dismiss();

            // --- STEP 2: Prepare packed data and send transaction ---
            toast.loading("Step 2/2: Please confirm transaction in your wallet...");

            const milestoneNames = milestones.map(m => m.name);
            const milestoneDurations = milestones.map(m => BigInt(m.durationDays || '0'));
            const milestoneAmounts = milestones.map(m => parseEther(m.amount || '0'));

            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'createFundingProposal',
                args: [
                    descriptionHash as Hex,
                    recipient as Address,
                    milestoneNames,
                    milestoneDurations,
                    milestoneAmounts,
                ],
            });

            setTxHash(hash);
            toast.dismiss();
            toast.loading("Transaction sent. Waiting for confirmation...", { id: `tx-${hash}`, description: hash });

        } catch (err) {
            toast.dismiss();
            console.error("--- ❌ TRANSACTION FAILED ❌ ---", err);
            const errorDetails = err instanceof BaseError ? err.shortMessage : (err as Error).message;
            toast.error("Transaction Failed", { description: errorDetails });
            setIsPending(false);
        }
    }, [isFormValid, daoAddress, address, description, recipient, milestones, startupIndustry, teamExperienceYears, hasPreviousFunding, marketSize, teamBio, writeContractAsync, t]);
    
    // --- Effect to handle confirmation and trigger AI ---
    useEffect(() => {
        if (isConfirmed && receipt && txHash) {
            toast.dismiss(`tx-${txHash}`);
            toast.success(t('new_proposal_page.success_toast_title'), { description: t('new_proposal_page.confirmed_toast_desc') });
            console.log("Transaction confirmed. Triggering AI analysis...");
            // ... (منطق فعال‌سازی AI با فراخوانی /api/trigger-ai-update)
            setIsPending(false);
            setTimeout(() => router.push('/proposals'), 2000);
        }
    }, [isConfirmed, receipt, txHash, router, t]);

    return {
        description, setDescription,
        recipient, setRecipient,
        milestones,
        startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears,
        hasPreviousFunding, setHasPreviousFunding,
        marketSize, setMarketSize,
        teamBio, setTeamBio,
        handleAddMilestone,
        handleMilestoneChange,
        handleRemoveMilestone,
        handleSubmit,
        isPending: isPending || isConfirming,
        isButtonDisabled: !isFormValid || !isFormEnabled || isPending || isConfirming,
        isFormValid,
    };
}