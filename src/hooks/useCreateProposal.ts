// src/hooks/useCreateProposal.ts - WITH SMART VALIDATION

"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Hex, decodeEventLog, isAddress } from 'viem';
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
    const isFinalizingRef = useRef(false);

    // --- Validation State ---
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- Wizard Control ---
    const [currentStep, setCurrentStep] = useState(1);
    const TOTAL_STEPS = 5;

    // --- Form States ---
    const [startupStage, setStartupStage] = useState<'idea' | 'revenue'>('idea');
    const [knowledgeBasedType, setKnowledgeBasedType] = useState<string>('none');
    const [projectName, setProjectName] = useState('');
    const [tagline, setTagline] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');

    const [companyRegId, setCompanyRegId] = useState('');
    const [foundedDate, setFoundedDate] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const [teamExperienceYears, setTeamExperienceYears] = useState('');
    const [linkedinProfile, setLinkedinProfile] = useState('');
    const [demoUrl, setDemoUrl] = useState('');

    const [problem, setProblem] = useState('');
    const [solution, setSolution] = useState('');
    const [businessModel, setBusinessModel] = useState('');
    const [marketSize, setMarketSize] = useState('');
    const [tam, setTam] = useState(''); 
    const [sam, setSam] = useState(''); 
    const [som, setSom] = useState(''); 
    const [competitors, setCompetitors] = useState('');

    const [burnRate, setBurnRate] = useState('');
    const [runway, setRunway] = useState('');
    const [revenueProj, setRevenueProj] = useState('');
    const [netProfit, setNetProfit] = useState('');
    const [ebitda, setEbitda] = useState('');
    const [valuation, setValuation] = useState('');
    const [paybackMonths, setPaybackMonths] = useState('');
    const [breakEven, setBreakEven] = useState('');
    
    const [recipient, setRecipient] = useState<string>('');
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);

    const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
    const [financialsFile, setFinancialsFile] = useState<File | null>(null);
    const [legalFile, setLegalFile] = useState<File | null>(null);
    const [whitepaperFile, setWhitepaperFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
    const [mongoId, setMongoId] = useState<string | null>(null);

    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: txError } = useWaitForTransactionReceipt({ hash: txHash });

    // --- 🛡️ SMART VALIDATION LOGIC ---
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        // Helper to set error
        const setError = (field: string, msgKey: string) => {
            newErrors[field] = t(msgKey);
            isValid = false;
        };

        // STEP 1: Basics
        if (step === 1) {
            if (!projectName.trim()) setError('projectName', 'validation.required');
            else if (projectName.length < 3) setError('projectName', 'validation.min_length_3');

            if (!tagline.trim()) setError('tagline', 'validation.required');
            
            if (!description.trim()) setError('description', 'validation.required');
            else if (description.length < 20) setError('description', 'validation.min_length_20');
        }

        // STEP 2: Team
        if (step === 2) {
            if (!foundedDate) setError('foundedDate', 'validation.required');
            
            if (!teamSize) setError('teamSize', 'validation.required');
            else if (Number(teamSize) < 1) setError('teamSize', 'validation.positive_number');

            if (!linkedinProfile.trim()) setError('linkedinProfile', 'validation.required');
            else if (!/^(https?:\/\/)?([\w]+\.)?linkedin\.com\/.+$/.test(linkedinProfile)) {
                setError('linkedinProfile', 'validation.url_invalid');
            }

            if (demoUrl && !/^(https?:\/\/)/.test(demoUrl)) {
                setError('demoUrl', 'validation.url_invalid_http');
            }
        }

        // STEP 3: Market
        if (step === 3) {
            if (!tam) setError('tam', 'validation.required');
            if (!sam) setError('sam', 'validation.required');
            if (!som) setError('som', 'validation.required');

            // Logic Check: TAM >= SAM >= SOM
            if (Number(tam) > 0 && Number(sam) > 0 && Number(tam) < Number(sam)) {
                setError('sam', 'validation.sam_gt_tam');
            }
            if (Number(sam) > 0 && Number(som) > 0 && Number(sam) < Number(som)) {
                setError('som', 'validation.som_gt_sam');
            }

            if (!competitors.trim()) setError('competitors', 'validation.required');
            if (!businessModel.trim()) setError('businessModel', 'validation.required');
        }

        // STEP 4: Financials
        if (step === 4) {
            if (startupStage === 'idea') {
                if (!burnRate) setError('burnRate', 'validation.required');
                if (!runway) setError('runway', 'validation.required');
            } else {
                if (!revenueProj) setError('revenueProj', 'validation.required');
                if (!netProfit) setError('netProfit', 'validation.required');
            }

            if (!valuation) setError('valuation', 'validation.required');

            // Milestones Validation
            const invalidMilestoneIdx = milestones.findIndex(m => !m.name.trim() || !m.amount || Number(m.amount) <= 0 || !m.durationDays);
            if (invalidMilestoneIdx >= 0) {
                // We use a general error key for milestones but you could map per index
                toast.error(t('proposals.new.validation_milestones'));
                isValid = false; 
            }
        }

        // STEP 5: Files & Final
        if (step === 5) {
            if (!pitchDeckFile) {
                toast.error(t('proposals.new.validation_pitch_deck'));
                isValid = false;
            }
            
            if (recipient && !isAddress(recipient)) {
                setError('recipient', 'validation.address_invalid');
            }
        }

        setErrors(newErrors);
        
        if (!isValid) {
            toast.warning(t('toasts.fix_errors'));
        }

        return isValid;
    };

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < TOTAL_STEPS) setCurrentStep(c => c + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    // پاک کردن خطا هنگام تایپ کردن کاربر
    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Wrapper setters to clear errors on change
    const wrapSet = (setter: any, field: string) => (val: any) => {
        setter(val);
        clearError(field);
    };

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

    const handleSubmit = useCallback(async () => {
        if (!validateStep(5)) return; // Final check
        if (!daoAddress) return toast.error(t('wallet.not_connected'));
        
        setIsSubmitting(true);
        isFinalizingRef.current = false;
        toastIdRef.current = toast.loading(t('toasts.uploading_docs'));

        try {
            const uploadFile = async (file: File | null) => {
                if (!file) return null;
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Upload failed');
                const data = await res.json();
                return data.ipfsHash;
            };

            const [pitchHash, finHash, legHash, wpHash] = await Promise.all([
                uploadFile(pitchDeckFile),
                uploadFile(financialsFile),
                uploadFile(legalFile),
                uploadFile(whitepaperFile)
            ]);

            if (toastIdRef.current) toast.loading(t('toasts.saving_proposal'), { id: toastIdRef.current });
            
            const fullProposalData = {
                type: 'funding',
                startupStage, 
                knowledgeBasedType,
                proposerAddress: address, 
                projectName, tagline, website, description, 
                problem, solution, businessModel,
                startupIndustry, teamExperienceYears, 
                marketStats: { marketSize, tam, sam, som, competitors },
                financialStats: { burnRate, runway, revenueProj, breakEven, ebitda, netProfit, valuation, paybackMonths },
                recipient: recipient || address, 
                milestones,
                documents: { pitchDeck: pitchHash, financials: finHash, legal: legHash, whitepaper: wpHash },
                extraData: { companyRegId, foundedDate, teamSize, demoUrl, linkedinProfile },
            };

            const apiRes = await fetch('/api/proposals/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullProposalData),
            });

            const apiData = await apiRes.json();
            if (!apiRes.ok) throw new Error(apiData.message || 'API Validation Error');
            
            setMongoId(apiData.mongoId);

            if (toastIdRef.current) toast.loading(t('toasts.confirm_in_wallet'), { id: toastIdRef.current });
            
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'submitFundingProposal',
                args: apiData.txArgs, 
            });
            
            if (toastIdRef.current) toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
            setTxHash(hash);

        } catch (error) {
            console.error("Submission Error:", error);
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(t('toasts.submission_failed'), { description: (error as Error).message });
            setIsSubmitting(false);
            setTxHash(undefined);
        }
    }, [
        daoAddress, address, writeContractAsync, t, validateStep,
        startupStage, knowledgeBasedType, 
        projectName, tagline, website, description, problem, solution, businessModel, 
        startupIndustry, teamExperienceYears, 
        marketSize, tam, sam, som, competitors, 
        burnRate, revenueProj, breakEven, runway, ebitda, netProfit, valuation, paybackMonths,
        recipient, milestones, 
        pitchDeckFile, financialsFile, legalFile, whitepaperFile,
        companyRegId, foundedDate, teamSize, demoUrl, linkedinProfile
    ]);

    // ... Post transaction effects (same as before) ...
    useEffect(() => {
        if (!txHash || !receipt || !mongoId || !isConfirmed) return;
        if (isFinalizingRef.current) return;
        isFinalizingRef.current = true;

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

                if (onChainId) {
                     await fetch(`/api/proposals/${mongoId}/update-onchain-id`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ onChainId: onChainId.toString() }),
                    });
                }
                if (toastIdRef.current) toast.loading(t('toasts.triggering_ai'), { id: toastIdRef.current });
                await fetch(`/api/proposals/${mongoId}/trigger-ai`, { method: 'POST' });

                if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                toast.success(t('toasts.proposal_created_success'));
                setTxHash(undefined);
                setMongoId(null);
                setIsSubmitting(false);
                setTimeout(() => router.push(`/proposals/${onChainId || 'latest'}`), 1000);
            } catch (error) {
                console.error(error);
                if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                toast.error(t('toasts.post_submission_failed'));
                setIsSubmitting(false);
                isFinalizingRef.current = false;
            }
        };
        finalizeProposal();
    }, [isConfirmed, receipt, txHash, mongoId, daoAddress, router, t]);

    useEffect(() => {
        if (isTxError) {
            if (toastIdRef.current) toast.dismiss(toastIdRef.current);
            toast.error(t('toasts.transaction_failed'), { description: txError?.message });
            setIsSubmitting(false);
            setTxHash(undefined);
        }
    }, [isTxError, txError, t]);

    return {
        errors, // Export errors for UI
        currentStep, TOTAL_STEPS, handleNextStep, handlePrevStep,
        
        // Wrapped Setters (for error clearing)
        setProjectName: wrapSet(setProjectName, 'projectName'),
        setTagline: wrapSet(setTagline, 'tagline'),
        setDescription: wrapSet(setDescription, 'description'),
        setCompanyRegId: wrapSet(setCompanyRegId, 'companyRegId'),
        setFoundedDate: wrapSet(setFoundedDate, 'foundedDate'),
        setTeamSize: wrapSet(setTeamSize, 'teamSize'),
        setLinkedinProfile: wrapSet(setLinkedinProfile, 'linkedinProfile'),
        setDemoUrl: wrapSet(setDemoUrl, 'demoUrl'),
        setTam: wrapSet(setTam, 'tam'),
        setSam: wrapSet(setSam, 'sam'),
        setSom: wrapSet(setSom, 'som'),
        setCompetitors: wrapSet(setCompetitors, 'competitors'),
        setBusinessModel: wrapSet(setBusinessModel, 'businessModel'),
        setBurnRate: wrapSet(setBurnRate, 'burnRate'),
        setRunway: wrapSet(setRunway, 'runway'),
        setRevenueProj: wrapSet(setRevenueProj, 'revenueProj'),
        setNetProfit: wrapSet(setNetProfit, 'netProfit'),
        setEbitda: wrapSet(setEbitda, 'ebitda'),
        setValuation: wrapSet(setValuation, 'valuation'),
        setRecipient: wrapSet(setRecipient, 'recipient'),

        // Other states (no validation needed or generic)
        startupStage, setStartupStage,
        knowledgeBasedType, setKnowledgeBasedType,
        website, setWebsite,
        problem, setProblem, solution, setSolution, startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears,
        marketSize, setMarketSize,
        breakEven, setBreakEven, paybackMonths, setPaybackMonths,
        milestones,
        pitchDeckFile, setPitchDeckFile,
        financialsFile, setFinancialsFile,
        legalFile, setLegalFile,
        whitepaperFile, setWhitepaperFile,
        
        isPending: isSubmitting || isConfirming, 
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone,
        handleSubmit,
        
        // Export raw values for binding
        projectName, tagline, description, companyRegId, foundedDate, teamSize, 
        linkedinProfile, demoUrl, tam, sam, som, competitors, businessModel,
        burnRate, runway, revenueProj, netProfit, ebitda, valuation, recipient
    };
}