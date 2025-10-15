// src/hooks/useCreateProposal.ts - FINAL REVISION: Handles On-Chain Tx and AI Oracle Trigger

"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, isAddress, parseEther, BaseError, Hex, decodeEventLog, encodeEventTopics, AbiEvent } from 'viem'; // ✅ NEW: Imports
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';

interface UseCreateProposalProps {
    daoAddress: Address | undefined;
    isFormEnabled: boolean;
}

/**
 * A custom hook to handle all logic for creating a new funding proposal.
 * It coordinates Off-chain storage, On-chain submission (User Wallet), and AI Oracle trigger.
 */
export function useCreateProposal({ daoAddress, isFormEnabled }: UseCreateProposalProps) {
    const { address } = useAccount(); 
    const { t } = useTranslation(); // ✅ Added t dependency here
    const router = useRouter(); // ✅ Added router dependency here
    const [description, setDescription] = useState('');
    const [recipient, setRecipient] = useState<string>(''); 
    const [milestoneAmounts, setMilestoneAmounts] = useState<string[]>(['']);
    // ✅ AI Features States
    const [startupIndustry, setStartupIndustry] = useState('');
    const [teamExperience, setTeamExperience] = useState('');
    const [isPending, setIsPending] = useState(false);   
    // State for intermediate steps
    const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
    // ✅ FIX 1: دریافت صحیح 'receipt' از هوک
    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
    // Wagmi hook for sending the transaction
    const { writeContractAsync } = useWriteContract();
    const handleAddMilestone = () => setMilestoneAmounts(prev => [...prev, '']);
    const handleMilestoneAmountChange = (index: number, value: string) => {
        const newAmounts = [...milestoneAmounts];
        newAmounts[index] = value;
        setMilestoneAmounts(newAmounts);
    };
    const handleRemoveMilestone = (index: number) => {
        const newAmounts = milestoneAmounts.filter((_, i) => i !== index);
        setMilestoneAmounts(newAmounts);
    };

    const parsedMilestoneAmounts = useMemo(() => {
        return milestoneAmounts
            .map(amount => {
                try { return parseEther(amount || '0'); } 
                catch { return 0n; }
            })
            .filter(amountBigInt => amountBigInt > 0n);
    }, [milestoneAmounts]);

    const isFormValid = useMemo(() => {
        return description.trim() !== '' &&
               isAddress(recipient) && 
               parsedMilestoneAmounts.length > 0 &&
               parsedMilestoneAmounts.length === milestoneAmounts.length &&
               startupIndustry.trim() !== '' && 
               teamExperience.trim() !== '';     
    }, [description, recipient, parsedMilestoneAmounts, milestoneAmounts, startupIndustry, teamExperience]);
    // --- END ORIGINAL CODE ---

  // ✅ NEW & CRITICAL: این useEffect اکنون داده‌های کامل را به AI Oracle ارسال می‌کند
    useEffect(() => {
        if (isConfirmed && receipt && daoAddress && txHash) {
            // STEP 3: تراکنش تأیید شد -> خواندن proposalId از رویدادها و فعال‌سازی AI Oracle
            
            try {
                // ✅ FIX 2: ایجاد داینامیک هش رویداد (جایگزین هاردکد)
                const proposalCreatedEvent = rayanChainDaoAbi.find(
                    (item) => item.type === 'event' && item.name === 'ProposalCreated'
                ) as AbiEvent | undefined;

                if (!proposalCreatedEvent) {
                    throw new Error("Could not find 'ProposalCreated' event in ABI.");
                }

                const eventTopic = encodeEventTopics({ abi: [proposalCreatedEvent] })[0];

                // ۱. پیدا کردن رویداد ProposalCreated در لاگ‌های تراکنش
                const proposalCreatedLog = receipt.logs.find(
                    // ✅ FIX 3: تعریف نوع داده برای 'log'
                    (log: { address: string; topics: readonly Hex[] }) =>
                        log.address.toLowerCase() === daoAddress.toLowerCase() &&
                        log.topics[0] === eventTopic
                );

                if (!proposalCreatedLog) {
                    throw new Error("Could not find ProposalCreated event in transaction logs.");
                }

                // ۲. decode کردن رویداد برای استخراج proposalId
                const decodedLog = decodeEventLog({
                    abi: rayanChainDaoAbi,
                    data: proposalCreatedLog.data,
                    topics: proposalCreatedLog.topics,
                });
                
                // ✅ FIX 4: اطمینان دادن به TypeScript که این رویداد صحیح است
                if (decodedLog.eventName !== 'ProposalCreated') {
                    throw new Error("Decoded log is not the ProposalCreated event.");
                }

                const proposalId = decodedLog.args.id;

                if (proposalId === undefined) {
                    throw new Error("Failed to decode proposal ID from event.");
                }

                // ۳. فراخوانی API برای فعال‌سازی AI با داده‌های کامل
                fetch('/api/trigger-ai-update', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     proposalId: Number(proposalId), // تبدیل BigInt به Number
                     aiFeatures: { startupIndustry, teamExperience },
                     milestoneAmounts
                 }), 
            }).then(res => {
                 if (res.ok) {
                     toast.success(t('new_proposal_page.success_toast_title'), {
                         description: `${t('new_proposal_page.confirmed_toast_desc')}. AI analysis triggered for Proposal #${proposalId}.`,
                     });
                 } else {
                     toast.error(t('new_proposal_page.ai_check_failed_title'), {
                         description: t('new_proposal_page.ai_check_failed_desc'),
                     });
                 }
            }).finally(() => {
                setIsPending(false);
                setTimeout(() => router.push('/proposals'), 2000);
                });
            } catch (error) {
                console.error("Error processing transaction receipt:", error);
                toast.error("Error", { description: (error as Error).message });
                setIsPending(false);
            }
        }
    }, [isConfirmed, receipt, daoAddress, txHash, router, t, startupIndustry, teamExperience, milestoneAmounts]);

    const handleSubmit = async (e: React.FormEvent, proposerAddress: Address | undefined) => {
        e.preventDefault();
        if (!isFormValid || !daoAddress || !proposerAddress || isPending) return;

        setIsPending(true);
        
        try {
            // STEP 1: Call Node.js API to save Off-chain data and get Hash
            const response = await fetch('/api/contract-creation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proposerAddress, 
                    daoAddress,
                    description,
                    recipientAddress: recipient,
                    milestoneAmounts,
                    aiFeatures: { startupIndustry, teamExperience }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Off-chain API call failed');
            }

            const data = await response.json();
            const { descriptionHash, txArgs } = data;

            // STEP 2: On-Chain Submission (Signed by USER'S WALLET)
            const submissionTxHash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'createFundingProposal',
                args: txArgs,
            } as any);

            setTxHash(submissionTxHash);
            toast.info(t('new_proposal_page.pending_toast_title'), { description: submissionTxHash });
            
        } catch (err) {
            // Log the Viem error for better debugging
            console.error(err);
            toast.error(t('new_proposal_page.error_toast_title'), {
                description: (err as BaseError)?.shortMessage || t('new_proposal_page.unexpected_error_desc'),
            });
            setIsPending(false);
        }
    };

    return {
        description, setDescription,
        recipient, setRecipient,
        milestoneAmounts,
        handleAddMilestone,
        handleMilestoneAmountChange,
        handleRemoveMilestone,
        // ✅ AI Feature states
        startupIndustry, setStartupIndustry,
        teamExperience, setTeamExperience,
        // ...
        handleSubmit,
        isPending: isPending || isConfirming, 
        isButtonDisabled: !isFormValid || isPending || isConfirming,
        isFormValid,
    };
}