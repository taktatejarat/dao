// src/hooks/useCreateProposal.ts - FINAL VERSION WITH ENHANCED MILESTONES & BUG FIXES

"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, isAddress, parseEther, BaseError, Hex, decodeEventLog, encodeEventTopics, AbiEvent } from 'viem';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';

// ✅ 1. تعریف یک اینترفیس جدید برای ساختار Milestone
export interface Milestone {
    name: string;
    durationDays: string; // به صورت رشته برای ورودی فرم
    amount: string;       // به صورت رشته برای ورودی فرم
}

interface UseCreateProposalProps {
    daoAddress: Address | undefined;
    isFormEnabled: boolean;
}

export function useCreateProposal({ daoAddress, isFormEnabled }: UseCreateProposalProps) {
    const { address } = useAccount();
    const { t } = useTranslation();
    const router = useRouter();

    // --- State های فرم ---
    const [description, setDescription] = useState('');
    const [recipient, setRecipient] = useState<string>('');
    const [startupIndustry, setStartupIndustry] = useState('');
    const [teamExperienceYears, setTeamExperienceYears] = useState('');
    const [hasPreviousFunding, setHasPreviousFunding] = useState('false');
    const [marketSize, setMarketSize] = useState('');
    const [teamBio, setTeamBio] = useState('');

    // ✅ 2. تغییر state مربوط به Milestone از string[] به Milestone[]
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);

    const [isPending, setIsPending] = useState(false);
    const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
    const { writeContractAsync } = useWriteContract();

    // --- توابع مدیریت Milestone (اصلاح شده) ---
    const handleAddMilestone = () => setMilestones(prev => [...prev, { name: '', durationDays: '', amount: '' }]);

    const handleMilestoneChange = (index: number, field: keyof Milestone, value: string) => {
        const newMilestones = [...milestones];
        // ✅ FIX 1: جلوگیری از ورودی غیرعددی برای مبلغ و مدت، که باگ اصلی بود
        if ((field === 'amount' || field === 'durationDays') && value !== '' && !/^\d*\.?\d*$/.test(value)) {
            return; // اگر ورودی عدد معتبر نیست، هیچ کاری انجام نده
        }
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    };

    const handleRemoveMilestone = (index: number) => {
        if (milestones.length > 1) { // همیشه حداقل یک milestone باقی بماند
            const newMilestones = milestones.filter((_, i) => i !== index);
            setMilestones(newMilestones);
        }
    };

    // ✅ 3. به‌روزرسانی Memo برای استخراج مقادیر مبلغ از ساختار جدید
    const parsedMilestoneAmounts = useMemo(() => {
        return milestones
            .map(m => {
                try { return parseEther(m.amount || '0'); }
                catch { return 0n; }
            })
            .filter(amountBigInt => amountBigInt > 0n);
    }, [milestones]);

    // ✅ 4. اصلاح منطق اعتبارسنجی فرم برای حل باگ 'فرم ناقص است'
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
               areMilestonesValid &&
               parsedMilestoneAmounts.length === milestones.length; // اطمینان از اینکه همه مبالغ معتبر هستند
    }, [description, recipient, startupIndustry, teamExperienceYears, marketSize, teamBio, milestones, parsedMilestoneAmounts]);

    // ✅ 3. به‌روزرسانی useEffect برای ارسال تمام داده‌های AI به Oracle
    useEffect(() => {
        if (isConfirmed && receipt && daoAddress && txHash) {
            try {
                const proposalCreatedEvent = rayanChainDaoAbi.find(
                    (item) => item.type === 'event' && item.name === 'ProposalCreated'
                ) as AbiEvent | undefined;

                if (!proposalCreatedEvent) throw new Error("ABI Error: 'ProposalCreated' event not found.");

                const eventTopic = encodeEventTopics({ abi: [proposalCreatedEvent] })[0];

                const proposalCreatedLog = receipt.logs.find(
                    (log: { address: string; topics: readonly Hex[] }) =>
                        log.address.toLowerCase() === daoAddress.toLowerCase() &&
                        log.topics[0] === eventTopic
                );

                if (!proposalCreatedLog) throw new Error("Could not find ProposalCreated event in transaction logs.");

                const decodedLog = decodeEventLog({ abi: rayanChainDaoAbi, data: proposalCreatedLog.data, topics: proposalCreatedLog.topics });
                
                if (decodedLog.eventName !== 'ProposalCreated') throw new Error("Decoded log is not the ProposalCreated event.");

                const proposalId = decodedLog.args.id;
                if (proposalId === undefined) throw new Error("Failed to decode proposal ID from event.");

                // ✅ CRITICAL FIX: ساخت آبجکت کامل aiFeatures برای ارسال
                const fullAiFeatures = {
                    industry: startupIndustry,
                    team_experience_years: parseInt(teamExperienceYears, 10) || 0,
                    has_previous_funding: hasPreviousFunding === 'true',
                    market_size_usd: parseInt(marketSize, 10) || 0,
                    team_bio: teamBio,
                };

                // فراخوانی API برای فعال‌سازی AI با داده‌های کامل
                fetch('/api/trigger-ai-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        proposalId: Number(proposalId),
                        aiFeatures: fullAiFeatures, // ارسال آبجکت کامل
                        // milestoneAmounts (اختیاری، اگر AI به آن نیاز دارد)
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
    }, [isConfirmed, receipt, daoAddress, txHash, router, t, startupIndustry, teamExperienceYears, hasPreviousFunding, marketSize, teamBio]); // ✅ 4. افزودن وابستگی‌های جدید

    const handleSubmit = async (e: React.FormEvent, proposerAddress: Address | undefined) => {
        e.preventDefault();
        if (!isFormValid || !daoAddress || !proposerAddress || isPending) return;
        setIsPending(true);
        
        try {
            // ✅ 5. ارسال تمام داده‌های جدید به API ذخیره‌سازی Off-chain
            const fullAiFeatures = {
                industry: startupIndustry,
                team_experience_years: parseInt(teamExperienceYears, 10) || 0,
                has_previous_funding: hasPreviousFunding === 'true',
                market_size_usd: parseInt(marketSize, 10) || 0,
                team_bio: teamBio,
            };

            const response = await fetch('/api/contract-creation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proposerAddress,
                    daoAddress,
                    description,
                    recipientAddress: recipient,
                    milestones: milestones, // ✅ ارسال ساختار کامل به API
                    aiFeatures: fullAiFeatures
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Off-chain API call failed');
            }

            const { txArgs } = await response.json();

            // STEP 2: On-Chain Submission
            const submissionTxHash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'createFundingProposal',
                args: txArgs,
            } as any);

            setTxHash(submissionTxHash);
            toast.info(t('new_proposal_page.pending_toast_title'), { description: submissionTxHash });
            
        } catch (err) {
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
        milestones, // ✅ اکسپورت کردن آرایه کامل آبجکت‌ها
        handleAddMilestone,
        handleMilestoneChange, // ✅ اکسپورت کردن تابع جدید
        handleRemoveMilestone,
        startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears,
        hasPreviousFunding, setHasPreviousFunding,
        marketSize, setMarketSize,
        teamBio, setTeamBio,
        handleSubmit,
        isPending: isPending || isConfirming,
        isButtonDisabled: !isFormValid || isPending || isConfirming,
        isFormValid,
    };
}