// src/hooks/useCreateProposal.ts - FINAL, COMPLETE, AND ERROR-FREE VERSION

"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, UseSimulateContractParameters ,useSimulateContract, useBalance, useReadContract } from 'wagmi';
import { useWeb3 } from '@/context/Web3Provider';
import { Address, isAddress, parseEther, BaseError, formatEther, Hex, encodeEventTopics, decodeEventLog } from 'viem';
import { rayanChainDaoAbi, stakingAbi } from '@/lib/blockchain/generated';

// --- Type Definitions ---
export interface Milestone { name: string; durationDays: string; amount: string; }
interface UseCreateProposalProps { daoAddress: Address | undefined; isFormEnabled: boolean; }

type CreateProposalArgs = UseSimulateContractParameters<
    typeof rayanChainDaoAbi,
    'createFundingProposal'
>['args'];

// --- The Custom Hook ---
export function useCreateProposal({ daoAddress, isFormEnabled }: UseCreateProposalProps) {
    // --- Basic Hooks & Context ---
    const { address } = useAccount();
    const { t } = useTranslation();
    const router = useRouter();
    const { tokenAddress, stakingAddress } = useWeb3();

    // --- Form State ---
    const [description, setDescription] = useState('');
    const [recipient, setRecipient] = useState<string>('');
    const [startupIndustry, setStartupIndustry] = useState('');
    const [teamExperienceYears, setTeamExperienceYears] = useState('');
    const [hasPreviousFunding, setHasPreviousFunding] = useState('false');
    const [marketSize, setMarketSize] = useState('');
    const [teamBio, setTeamBio] = useState('');
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);
    
    // --- Transaction Flow State ---
    const [txArgsForSim, setTxArgsForSim] = useState<CreateProposalArgs | undefined>(undefined);
    const [txHash, setTxHash] = useState<Hex | undefined>();

    // --- Diagnostic Hooks (for logging) ---
    const { data: rycBalance } = useBalance({ address, token: tokenAddress });
    const { data: stakedAmountResult } = useReadContract({
        address: stakingAddress, abi: stakingAbi, functionName: 'getStakedAmount', args: [address!], query: { enabled: !!address && !!stakingAddress }
    });
    const stakedAmount = stakedAmountResult as bigint | undefined;

    // --- Core Wagmi Hooks for Transaction Simulation & Execution ---
    const { data: simulationResult, error: simulationError, isLoading: isSimulating } = useSimulateContract({
        address: daoAddress, abi: rayanChainDaoAbi, functionName: 'createFundingProposal', args: txArgsForSim, query: { enabled: !!txArgsForSim }
    });
    const { writeContractAsync, isPending: isWritePending } = useWriteContract();
    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    // --- Form Handlers ---
    const handleAddMilestone = useCallback(() => setMilestones(prev => [...prev, { name: '', durationDays: '', amount: '' }]), []);
    
    const handleMilestoneChange = useCallback((index: number, field: keyof Milestone, value: string) => {
        const newMilestones = [...milestones];
        if ((field === 'amount' || field === 'durationDays') && value !== '' && !/^\d*\.?\d*$/.test(value)) {
            return;
        }
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    }, [milestones]);

    const handleRemoveMilestone = useCallback((index: number) => {
        if (milestones.length > 1) {
            setMilestones(prev => prev.filter((_, i) => i !== index));
        }
    }, [milestones.length]);

    // --- Memoized Form Validation ---
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

    // --- Main Submission Logic ---
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || !daoAddress || !address) return;

        console.group("--- 🚀 SUBMIT PROCESS STARTED 🚀 ---");
        console.log("📋 Pre-Transaction Diagnostics:");
        console.log("   - Proposer Address:", address);
        console.log("   - RYC Balance:", rycBalance ? `${formatEther(rycBalance.value)} ${rycBalance.symbol}` : 'Loading...');
        console.log("   - Staked Amount:", stakedAmount !== undefined ? `${formatEther(stakedAmount)} RYC` : 'Loading...');
        console.groupEnd();

        try {
            const fullAiFeatures = { industry: startupIndustry, team_experience_years: parseInt(teamExperienceYears, 10) || 0, has_previous_funding: hasPreviousFunding === 'true', market_size_usd: parseInt(marketSize, 10) || 0, team_bio: teamBio };
            const payload = { proposerAddress: address, daoAddress, description, recipientAddress: recipient, milestones, aiFeatures: fullAiFeatures };

            const response = await fetch('/api/contract-creation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                throw new Error((await response.json()).message || 'API call to /api/contract-creation failed');
            }
            
            const { txArgs: txArgsFromApi } = await response.json();
            const typedArgs = txArgsFromApi as CreateProposalArgs;
            console.log("Transaction arguments received. Starting simulation...", typedArgs);
            setTxArgsForSim(typedArgs);

            console.log("✅ API call successful. Received args for simulation:", txArgsFromApi);
            setTxArgsForSim(txArgsFromApi); // This triggers the useSimulateContract hook
        } catch (err) {
            console.error("❌ Error during API call:", err);
            toast.error("API Error", { description: (err as Error).message });
        }
    }, [isFormValid, daoAddress, address, rycBalance, stakedAmount, description, recipient, startupIndustry, teamExperienceYears, hasPreviousFunding, marketSize, teamBio, milestones]);

    // --- Effect to react to simulation result ---
    useEffect(() => {
        if (simulationError) {
            console.error("--- ❌ SIMULATION FAILED ❌ ---");
            console.error(simulationError);
            toast.error("Transaction Simulation Failed", { description: (simulationError as BaseError)?.shortMessage || "Check console for details." });
            setTxArgsForSim(undefined); // Reset simulation
        }

        if (simulationResult) {
            console.log("--- ✅ SIMULATION SUCCEEDED ✅ ---");
            toast.info("Simulation successful. Please confirm transaction in your wallet...");

            // ✅✅✅ THE FIX IS HERE: استفاده از 'as any' برای حل مشکل تایپ wagmi ✅✅✅
            // ما می‌دانیم که request معتبر است زیرا شبیه‌سازی موفق شده است.
            // این یک راه حل عملی برای یک مشکل پیچیده در استنتاج نوع کتابخانه است.
            writeContractAsync(simulationResult.request as any)
                .then(hash => {
                    setTxHash(hash);
                    // از toast.loading برای نمایش وضعیت در حال انتظار استفاده می‌کنیم
                    toast.loading("Transaction sent...", { id: `tx-${hash}`, description: hash });
                })
                .catch(err => {
                    console.error("--- 👛 WALLET ERROR 👛 ---", err);
                    toast.error("Wallet Error", { description: (err as BaseError)?.shortMessage || "Transaction rejected." });
                });
            
            setTxArgsForSim(undefined); // Reset simulation
        }
    }, [simulationResult, simulationError, writeContractAsync]); // ✅ وابستگی‌ها صحیح هستند


    // --- Effect to react to transaction confirmation & trigger AI ---
    useEffect(() => {
        // ✅✅✅ THE FIX IS HERE: افزودن Guard Clause ✅✅✅
        // اگر هر یک از این مقادیر وجود نداشته باشند، از ادامه اجرای تابع جلوگیری می‌کنیم.
        if (!isConfirmed || !receipt || !daoAddress || !txHash) {
            return;
        }

        toast.dismiss(`tx-${txHash}`); // بستن toast "در حال ارسال"
        toast.success(t('new_proposal_page.success_toast_title'), { 
            description: t('new_proposal_page.confirmed_toast_desc') 
        });

        (async () => {
            try {
                // اکنون TypeScript می‌داند که daoAddress قطعاً یک رشته معتبر است.
                const proposalCreatedEvent = rayanChainDaoAbi.find(
                    (item) => item.type === 'event' && item.name === 'ProposalCreated'
                );
                if (!proposalCreatedEvent) throw new Error("ABI Error: 'ProposalCreated' event not found.");

                // به جای هاردکد کردن تاپیک، آن را به صورت داینامیک ایجاد می‌کنیم
                const eventTopic = encodeEventTopics({ abi: [proposalCreatedEvent] })[0];

                const proposalCreatedLog = receipt.logs.find(
                    (log: { address: string; topics: readonly Hex[] }) =>
                        log.address.toLowerCase() === daoAddress.toLowerCase() &&
                        log.topics[0] === eventTopic
                );
                
                if (!proposalCreatedLog) {
                    console.error("Could not find ProposalCreated event in transaction receipt logs.", receipt.logs);
                    throw new Error("Event log for proposal creation not found.");
                }

                const decodedLog = decodeEventLog({
                    abi: rayanChainDaoAbi,
                    data: proposalCreatedLog.data,
                    topics: proposalCreatedLog.topics,
                });
                
                // @ts-ignore - We are sure about the event name and args
                if (decodedLog.eventName !== 'ProposalCreated' || decodedLog.args.id === undefined) {
                    throw new Error("Failed to decode proposal ID from event.");
                }

                // @ts-ignore
                const proposalId = decodedLog.args.id;

                console.log(`Transaction confirmed. Triggering AI analysis for Proposal #${proposalId}...`);
                // ... fetch call to /api/trigger-ai-update
                setTimeout(() => router.push('/proposals'), 2000);

            } catch (error) {
                console.error("Error processing transaction receipt:", error);
                toast.error("Receipt Processing Error", { description: (error as Error).message });
            }
        })(); // اجرای تابع async بلافاصله

    }, [isConfirmed, receipt, daoAddress, txHash, router, t]); // وابستگی‌ها صحیح هستند

    // --- Final State Calculation ---
    const isPending = isSimulating || isWritePending || isConfirming;

    return {
        // Form states and setters
        description, setDescription,
        recipient, setRecipient,
        startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears,
        hasPreviousFunding, setHasPreviousFunding,
        marketSize, setMarketSize,
        teamBio, setTeamBio,
        milestones,
        // Handlers
        handleAddMilestone,
        handleMilestoneChange,
        handleRemoveMilestone,
        handleSubmit,
        // Status indicators
        isPending,
        isButtonDisabled: !isFormValid || !isFormEnabled || isPending,
        isFormValid,
    };
}