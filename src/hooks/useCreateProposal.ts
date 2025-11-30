// src/hooks/useCreateProposal.ts

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { isAddress, Hex, decodeEventLog, Log } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// --- Type Definitions ---
export interface Milestone { name: string; durationDays: string; amount: string; }
interface UseCreateProposalProps {
    daoAddress: `0x${string}` | undefined; // Type refinement for stricter checks
    router: AppRouterInstance;
}

export function useCreateProposal({ daoAddress, router }: UseCreateProposalProps) {
    const { address } = useAccount();
    const { t } = useTranslation();
    const { writeContractAsync } = useWriteContract();

    // --- Form States ---
    const [projectName, setProjectName] = useState('');
    const [tagline, setTagline] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');
    const [problem, setProblem] = useState('');
    const [solution, setSolution] = useState('');
    const [businessModel, setBusinessModel] = useState('');
    const [startupIndustry, setStartupIndustry] = useState('');
    const [teamExperienceYears, setTeamExperienceYears] = useState('');
    const [teamBio, setTeamBio] = useState('');
    const [marketSize, setMarketSize] = useState('');
    const [competitors, setCompetitors] = useState('');
    const [hasPreviousFunding, setHasPreviousFunding] = useState('false');
    const [fundingHistoryDetails, setFundingHistoryDetails] = useState('');
    const [recipient, setRecipient] = useState<string>('');
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);
    
    const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
    const [financialsFile, setFinancialsFile] = useState<File | null>(null);
    const [legalFile, setLegalFile] = useState<File | null>(null);

    // --- Process States ---
    const [isSubmitting, setIsSubmitting] = useState(false); // General loading state
    const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
    const [mongoId, setMongoId] = useState<string | null>(null);

    // NEW: Ref to hold toast ID
    const toastIdRef = useRef<string | number | null>(null);
    // --- Wagmi Transaction Monitoring ---
    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: txError } = useWaitForTransactionReceipt({ 
        hash: txHash,
        confirmations: 1 // Wait for at least 1 confirmation block
    });

    // --- Form Validation ---
    const isFormValid = useMemo(() => {
        const areMilestonesValid = milestones.every(m => m.name.trim() && m.durationDays.trim() && m.amount.trim());
        return projectName.trim() !== '' &&
               description.trim().length >= 20 && // Reduced for easier testing, adjust as needed
               isAddress(recipient) &&
               areMilestonesValid;
    }, [projectName, description, recipient, milestones]);

    // --- Handlers ---
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

    // --- SUBMISSION LOGIC ---
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || !daoAddress) {
            toast.warning(t('toasts.fill_all_fields'));
            return;
        }

        setIsSubmitting(true);
        // شروع پروسه: نمایش لودینگ اولیه
        toastIdRef.current = toast.loading(t('toasts.uploading_docs'));

        try {
            // 1. Upload Files (Mock or Real)
            const uploadFile = async (file: File | null) => {
                if (!file) return null;
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Upload failed');
                const data = await res.json();
                return data.ipfsHash;
            };

            const [pitchDeckHash, financialsHash, legalHash] = await Promise.all([
                uploadFile(pitchDeckFile),
                uploadFile(financialsFile),
                uploadFile(legalFile),
            ]);

            // 2. Save Off-Chain (MongoDB)
            toast.loading(t('toasts.saving_proposal'), { id: toastIdRef.current! });
            const payload = {
                proposerAddress: address, projectName, tagline, website, description, problem, solution, businessModel,
                startupIndustry, teamExperienceYears, teamBio, marketSize, competitors,
                hasPreviousFunding, fundingHistoryDetails, recipient, milestones,
                documents: { pitchDeck: pitchDeckHash, financials: financialsHash, legal: legalHash },
            };

            const apiRes = await fetch('/api/proposals/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const apiData = await apiRes.json();
            if (!apiRes.ok) throw new Error(apiData.message || 'API Error');
            
            setMongoId(apiData.mongoId); // CRITICAL: Save this for step 4

            // 3. Submit On-Chain
            toast.loading(t('toasts.confirm_in_wallet'), { id: toastIdRef.current! });
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'submitFundingProposal',
                args: apiData.txArgs,
            });
            
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current! });
            setTxHash(hash); // Starts the useEffect watcher

        } catch (error) {
            // ✅ FIX: بستن لودینگ و نمایش خطا
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(t('toasts.submission_failed'), { description: (error as Error).message });
            setIsSubmitting(false);
            setTxHash(undefined);
        }
    }, [isFormValid, daoAddress, address, writeContractAsync, t, projectName, tagline, website, description, problem, solution, businessModel, startupIndustry, teamExperienceYears, teamBio, marketSize, competitors, hasPreviousFunding, fundingHistoryDetails, recipient, milestones, pitchDeckFile, financialsFile, legalFile]);

    // --- POST-TRANSACTION EFFECT ---
    useEffect(() => {
        // Only run if we have a hash, receipt, and mongoId, and haven't finished yet
        if (!txHash || !receipt || !mongoId || !isConfirmed) return;

        const finalizeProposal = async () => {
            const toastId = 'finalize-toast';
            if (toastIdRef.current) toast.loading(t('toasts.processing_onchain_data'), { id: toastIdRef.current });

            try {
                // A. Find the Event
                // We look for logs emitted by the DAO address
                const daoLogs = receipt.logs.filter(l => l.address.toLowerCase() === daoAddress?.toLowerCase());
                let onChainId: bigint | null = null;

                for (const log of daoLogs) {
                    try {
                        const decoded = decodeEventLog({
                            abi: rayanChainDaoAbi,
                            data: log.data,
                            topics: log.topics,
                        });
                        if (decoded.eventName === 'ProposalCreated') {
                            onChainId = (decoded.args as any).id;
                            break;
                        }
                    } catch (e) {
                        // Ignore logs that don't match the ABI (e.g. from internal OpenZeppelin calls)
                        continue;
                    }
                }

                if (onChainId === null) {
                    throw new Error("Could not find ProposalCreated event in transaction logs.");
                }

                // B. Update MongoDB with OnChain ID
                await fetch(`/api/proposals/${mongoId}/update-onchain-id`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ onChainId: onChainId.toString() }),
                });

                // C. Trigger AI
                toast.loading(t('toasts.triggering_ai'), { id: toastId });
                // Note: The python engine reads data from DB using mongoId, so no need to send body here
                // unless your specific route requires it. We keep it simple as per standard arch.
                await fetch(`/api/proposals/${mongoId}/trigger-ai`, { method: 'POST' });

                //  FIX: بستن لودینگ و نمایش پیام موفقیت نهایی
                if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                toast.success(t('toasts.proposal_created_success'));
                
                setTxHash(undefined);
                setMongoId(null);
                
                setTimeout(() => {
                    router.push(`/proposals/${onChainId}`);
                }, 1500);

            } catch (error) {
                if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                toast.error(t('toasts.post_submission_failed'));
                setIsSubmitting(false);
            }
        };

        finalizeProposal();

    }, [isConfirmed, receipt, txHash, mongoId, daoAddress, router, t]);

    // Error Handling
    useEffect(() => {
        if (isTxError) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(t('toasts.transaction_failed'), { description: txError?.message });
            setIsSubmitting(false);
            setTxHash(undefined);
        }
    }, [isTxError, txError, t]);

    return {
        projectName, setProjectName, tagline, setTagline, website, setWebsite,
        description, setDescription, problem, setProblem, solution, setSolution,
        businessModel, setBusinessModel, startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears, teamBio, setTeamBio,
        marketSize, setMarketSize, competitors, setCompetitors,
        hasPreviousFunding, setHasPreviousFunding, fundingHistoryDetails, setFundingHistoryDetails,
        recipient, setRecipient, milestones,
        setPitchDeckFile, setFinancialsFile, setLegalFile,
        isPending: isSubmitting || isConfirming, 
        isFormValid,
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone,
        handleSubmit,
    };
}