// src/hooks/useCreateProposal.ts

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { isAddress, Hex, decodeEventLog } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface Milestone { name: string; durationDays: string; amount: string; }
interface UseCreateProposalProps {
    daoAddress: `0x${string}` | undefined;
    router: AppRouterInstance;
}

export function useCreateProposal({ daoAddress, router }: UseCreateProposalProps) {
    const { address } = useAccount();
    const { t } = useTranslation();
    const { writeContractAsync } = useWriteContract();
    const toastIdRef = useRef<string | number | null>(null);

    // --- Form States (Updated) ---
    const [projectName, setProjectName] = useState('');
    const [tagline, setTagline] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');
    const [problem, setProblem] = useState('');
    const [solution, setSolution] = useState('');
    const [businessModel, setBusinessModel] = useState('');
    const [startupIndustry, setStartupIndustry] = useState('');
    
    // Team
    const [teamExperienceYears, setTeamExperienceYears] = useState('');
    const [teamBio, setTeamBio] = useState('');
    
    // Market (NEW)
    const [marketSize, setMarketSize] = useState(''); // Legacy field (kept for compatibility)
    const [tam, setTam] = useState(''); 
    const [sam, setSam] = useState(''); 
    const [som, setSom] = useState(''); 
    const [competitors, setCompetitors] = useState('');

    // Financials (NEW)
    const [burnRate, setBurnRate] = useState('');
    const [revenueProj, setRevenueProj] = useState('');
    const [breakEven, setBreakEven] = useState('');
    const [hasPreviousFunding, setHasPreviousFunding] = useState('false');
    const [fundingHistoryDetails, setFundingHistoryDetails] = useState('');
    const [recipient, setRecipient] = useState<string>('');
    
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);
    
    // Files
    const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
    const [financialsFile, setFinancialsFile] = useState<File | null>(null);
    const [legalFile, setLegalFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
    const [mongoId, setMongoId] = useState<string | null>(null);

    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: txError } = useWaitForTransactionReceipt({ hash: txHash, confirmations: 1 });

    // --- Validation ---
    const isFormValid = useMemo(() => {
        const areMilestonesValid = milestones.every(m => m.name.trim() && m.durationDays.trim() && m.amount.trim());
        return projectName.trim() !== '' &&
               description.trim().length >= 20 &&
               isAddress(recipient) &&
               areMilestonesValid;
        // Note: You can add stricter validation for new fields (TAM/SAM/SOM) if needed
    }, [projectName, description, recipient, milestones]);

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

    // --- Submit Logic ---
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || !daoAddress) {
            toast.warning(t('toasts.fill_all_fields'));
            return;
        }

        setIsSubmitting(true);
        toastIdRef.current = toast.loading(t('toasts.uploading_docs'));

        try {
            // 1. Upload Files
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

            // 2. Save Off-Chain (Updated Structure)
            toast.loading(t('toasts.saving_proposal'), { id: toastIdRef.current! });
            
            const fullProposalData = {
                proposerAddress: address, projectName, tagline, website, description, problem, solution, businessModel,
                startupIndustry, 
                teamExperienceYears, teamBio, 
                // New Structure for Market & Financials
                marketStats: { 
                    marketSize, // keep legacy if needed or replace
                    tam, sam, som, competitors 
                },
                financialStats: { 
                    burnRate, revenueProj, breakEven,
                    hasPreviousFunding, fundingHistoryDetails 
                },
                recipient, milestones,
                documents: { pitchDeck: pitchDeckHash, financials: financialsHash, legal: legalHash },
            };

            const apiRes = await fetch('/api/proposals/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullProposalData),
            });

            const apiData = await apiRes.json();
            if (!apiRes.ok) {
                // Handle Zod validation errors if present
                if (apiData.errors) console.error(apiData.errors);
                throw new Error(apiData.message || 'API Error');
            }
            
            setMongoId(apiData.mongoId);

            // 3. Submit On-Chain
            toast.loading(t('toasts.confirm_in_wallet'), { id: toastIdRef.current! });
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'submitFundingProposal',
                args: apiData.txArgs,
            });
            
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current! });
            setTxHash(hash);

        } catch (error) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(t('toasts.submission_failed'), { description: (error as Error).message });
            setIsSubmitting(false);
            setTxHash(undefined);
        }
    }, [
        isFormValid, daoAddress, address, writeContractAsync, t, 
        projectName, tagline, website, description, problem, solution, businessModel, 
        startupIndustry, teamExperienceYears, teamBio, 
        marketSize, tam, sam, som, competitors, 
        burnRate, revenueProj, breakEven, hasPreviousFunding, fundingHistoryDetails, 
        recipient, milestones, pitchDeckFile, financialsFile, legalFile
    ]);

    // --- Post-Transaction Effect (Same as before) ---
    useEffect(() => {
        if (!txHash || !receipt || !mongoId || !isConfirmed) return;

        const finalizeProposal = async () => {
            if (toastIdRef.current) toast.loading(t('toasts.processing_onchain_data'), { id: toastIdRef.current });
            try {
                const daoLogs = receipt.logs.filter(l => l.address.toLowerCase() === daoAddress?.toLowerCase());
                let onChainId: bigint | null = null;

                for (const log of daoLogs) {
                    try {
                        const decoded = decodeEventLog({ abi: rayanChainDaoAbi, data: log.data, topics: log.topics });
                        if (decoded.eventName === 'ProposalCreated') {
                            onChainId = (decoded.args as any).id;
                            break;
                        }
                    } catch (e) { continue; }
                }

                if (onChainId === null) throw new Error("Event not found");

                await fetch(`/api/proposals/${mongoId}/update-onchain-id`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ onChainId: onChainId.toString() }),
                });

                toast.loading(t('toasts.triggering_ai'), { id: toastIdRef.current! });
                await fetch(`/api/proposals/${mongoId}/trigger-ai`, { method: 'POST' });

                if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                toast.success(t('toasts.proposal_created_success'));
                setTxHash(undefined);
                setMongoId(null);
                
                setTimeout(() => router.push(`/proposals/${onChainId}`), 1500);

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
        marketSize, setMarketSize, tam, setTam, sam, setSam, som, setSom, competitors, setCompetitors,
        burnRate, setBurnRate, revenueProj, setRevenueProj, breakEven, setBreakEven,        
        hasPreviousFunding, setHasPreviousFunding, fundingHistoryDetails, setFundingHistoryDetails,
        recipient, setRecipient, milestones,
        setPitchDeckFile, setFinancialsFile, setLegalFile,
        isPending: isSubmitting || isConfirming, 
        isFormValid,
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone,
        handleSubmit,
    };
}