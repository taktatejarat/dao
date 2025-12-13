// src/hooks/useCreateProposal.ts - FULLY RESTORED & FIXED

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
    
    // رفرنس برای مدیریت تست‌های پی‌در‌پی
    const toastIdRef = useRef<string | number | undefined>(undefined);
    const isFinalizingRef = useRef(false);

    // --- Validation State ---
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- Wizard Control ---
    const [currentStep, setCurrentStep] = useState(1);
    const TOTAL_STEPS = 5;

    // --- Form States (ALL RESTORED) ---
    const [startupStage, setStartupStage] = useState<'idea' | 'revenue'>('idea');
    const [knowledgeBasedType, setKnowledgeBasedType] = useState<string>('none');
    
    // Step 1: Basics
    const [projectName, setProjectName] = useState('');
    const [tagline, setTagline] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');
    const [startupIndustry, setStartupIndustry] = useState(''); // New

    // Step 2: Team & Company
    const [companyRegId, setCompanyRegId] = useState('');
    const [foundedDate, setFoundedDate] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const [teamExperienceYears, setTeamExperienceYears] = useState(''); // New
    const [linkedinProfile, setLinkedinProfile] = useState('');
    const [demoUrl, setDemoUrl] = useState('');

    // Step 3: Market
    const [problem, setProblem] = useState('');
    const [solution, setSolution] = useState('');
    const [businessModel, setBusinessModel] = useState('');
    const [marketSize, setMarketSize] = useState('');
    const [tam, setTam] = useState(''); 
    const [sam, setSam] = useState(''); 
    const [som, setSom] = useState(''); 
    const [competitors, setCompetitors] = useState('');

    // Step 4: Financials
    const [burnRate, setBurnRate] = useState('');
    const [runway, setRunway] = useState('');
    const [revenueProj, setRevenueProj] = useState('');
    const [netProfit, setNetProfit] = useState('');
    const [ebitda, setEbitda] = useState('');
    const [valuation, setValuation] = useState('');
    const [paybackMonths, setPaybackMonths] = useState('');
    const [breakEven, setBreakEven] = useState('');
    const [hasPreviousFunding, setHasPreviousFunding] = useState('false');
    const [fundingHistoryDetails, setFundingHistoryDetails] = useState('');
    
    const [recipient, setRecipient] = useState<string>('');
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);

    // Step 5: Files
    const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
    const [financialsFile, setFinancialsFile] = useState<File | null>(null);
    const [legalFile, setLegalFile] = useState<File | null>(null);
    const [whitepaperFile, setWhitepaperFile] = useState<File | null>(null);

    // Transaction States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
    const [mongoId, setMongoId] = useState<string | null>(null);

    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: txError } = useWaitForTransactionReceipt({ hash: txHash });

    // --- Validation Logic ---
    const validateStep = (step: number, silent: boolean = false): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        const setError = (field: string, msgKey: string) => {
            newErrors[field] = t(msgKey);
            isValid = false;
        };

        if (step === 1) {
            if (!projectName.trim()) setError('projectName', 'validation.required');
            if (!tagline.trim()) setError('tagline', 'validation.required');
            if (!startupIndustry.trim()) setError('startupIndustry', 'validation.required');
            if (!description.trim()) setError('description', 'validation.required');
        }

        if (step === 2) {
            if (!foundedDate) setError('foundedDate', 'validation.required');
            if (!teamSize) setError('teamSize', 'validation.required');
            if (!linkedinProfile.trim()) setError('linkedinProfile', 'validation.required');
        }

        if (step === 3) {
            if (!tam) setError('tam', 'validation.required');
            if (!sam) setError('sam', 'validation.required');
            if (!som) setError('som', 'validation.required');
            if (!businessModel.trim()) setError('businessModel', 'validation.required');
            if (!competitors.trim()) setError('competitors', 'validation.required');
        }

        if (step === 4) {
            if (startupStage === 'idea') {
                if (!burnRate) setError('burnRate', 'validation.required');
                if (!runway) setError('runway', 'validation.required');
            } else {
                if (!revenueProj) setError('revenueProj', 'validation.required');
                if (!netProfit) setError('netProfit', 'validation.required');
            }
            if (!valuation) setError('valuation', 'validation.required');
            
            const invalidMilestone = milestones.find(m => !m.name.trim() || !m.amount || !m.durationDays);
            if (invalidMilestone) isValid = false;
        }

        if (step === 5) {
            if (!pitchDeckFile) isValid = false;
            if (recipient && !isAddress(recipient)) setError('recipient', 'validation.address_invalid');
        }

        setErrors(prev => ({ ...prev, ...newErrors }));
        
        if (!isValid && !silent) {
            toast.warning(t('toasts.fix_errors'));
        }

        return isValid;
    };

    // --- Navigation & Helpers ---
    const handleNextStep = () => {
        setErrors({}); 
        if (validateStep(currentStep)) {
            if (currentStep < TOTAL_STEPS) setCurrentStep(c => c + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

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

    // --- SUBMIT ---
    const handleSubmit = useCallback(async () => {
        // Validate ALL steps before submitting
        let allValid = true;
        for (let i = 1; i <= 5; i++) {
            if (!validateStep(i, true)) allValid = false;
        }

        if (!allValid) {
            return toast.error(t('toasts.fix_errors'));
        }

        if (!daoAddress) return toast.error(t('wallet.not_connected'));
        
        setIsSubmitting(true);
        isFinalizingRef.current = false;
        
        // Start Toast
        toastIdRef.current = toast.loading(t('toasts.uploading_docs'));

        try {
            // 1. Upload
            const uploadFile = async (file: File | null) => {
                if (!file) return null;
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Upload failed');
                return (await res.json()).ipfsHash;
            };

            const [pitchHash, finHash, legHash, wpHash] = await Promise.all([
                uploadFile(pitchDeckFile),
                uploadFile(financialsFile),
                uploadFile(legalFile),
                uploadFile(whitepaperFile)
            ]);

            // 2. Save Off-Chain
            toast.loading(t('toasts.saving_proposal'), { id: toastIdRef.current });
            
            const fullProposalData = {
                type: 'funding',
                startupStage, 
                knowledgeBasedType,
                proposerAddress: address, 
                projectName, tagline, website, description, 
                problem, solution, businessModel,
                startupIndustry, teamExperienceYears, 
                marketStats: { marketSize, tam, sam, som, competitors },
                financialStats: { burnRate, runway, revenueProj, breakEven, ebitda, netProfit, valuation, paybackMonths, hasPreviousFunding, fundingHistoryDetails },
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

            // 3. Submit On-Chain
            toast.loading(t('toasts.confirm_in_wallet'), { id: toastIdRef.current });
            
            const hash = await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: 'submitFundingProposal',
                args: apiData.txArgs, 
            });
            
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
            setTxHash(hash);

        } catch (error) {
            console.error(error);
            toast.error(t('toasts.submission_failed'), { id: toastIdRef.current, description: (error as Error).message });
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
        companyRegId, foundedDate, teamSize, demoUrl, linkedinProfile, hasPreviousFunding, fundingHistoryDetails
    ]);

    // --- Post Transaction ---
    useEffect(() => {
        if (!txHash || !receipt || !mongoId || !isConfirmed) return;
        if (isFinalizingRef.current) return;
        isFinalizingRef.current = true;

        const finalizeProposal = async () => {
            toast.loading(t('toasts.processing_onchain_data'), { id: toastIdRef.current });
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

                toast.loading(t('toasts.triggering_ai'), { id: toastIdRef.current });
                
                // Trigger AI Call
                const aiRes = await fetch(`/api/proposals/${mongoId}/trigger-ai`, { method: 'POST' });
                const aiJson = await aiRes.json();

                if (aiJson.success) {
                    toast.success(t('toasts.proposal_created_success'), { id: toastIdRef.current });
                } else {
                    // Warning instead of error if AI fails but proposal is safe
                    toast.warning("Proposal created, but AI Analysis failed/pending.", { id: toastIdRef.current });
                }
                
                setTxHash(undefined);
                setMongoId(null);
                setIsSubmitting(false);
                
                setTimeout(() => router.push(`/proposals/${onChainId || 'latest'}`), 1000);

            } catch (error) {
                console.error(error);
                toast.error(t('toasts.post_submission_failed'), { id: toastIdRef.current });
                setIsSubmitting(false);
                isFinalizingRef.current = false;
            }
        };

        finalizeProposal();
    }, [isConfirmed, receipt, txHash, mongoId, daoAddress, router, t]);

    useEffect(() => {
        if (isTxError) {
            toast.error(t('toasts.transaction_failed'), { id: toastIdRef.current, description: txError?.message });
            setIsSubmitting(false);
            setTxHash(undefined);
        }
    }, [isTxError, txError, t]);

    return {
        // Validation Export
        errors, 
        currentStep, TOTAL_STEPS, handleNextStep, handlePrevStep,
        
        // Wrapped Setters (for auto clearing errors)
        setProjectName: wrapSet(setProjectName, 'projectName'),
        setTagline: wrapSet(setTagline, 'tagline'),
        setDescription: wrapSet(setDescription, 'description'),
        setStartupIndustry: wrapSet(setStartupIndustry, 'startupIndustry'),
        setCompanyRegId: wrapSet(setCompanyRegId, 'companyRegId'),
        setFoundedDate: wrapSet(setFoundedDate, 'foundedDate'),
        setTeamSize: wrapSet(setTeamSize, 'teamSize'),
        setTeamExperienceYears: wrapSet(setTeamExperienceYears, 'teamExperienceYears'),
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

        // Other Setters & Values
        startupStage, setStartupStage,
        knowledgeBasedType, setKnowledgeBasedType,
        website, setWebsite,
        problem, setProblem, solution, setSolution, 
        startupIndustry, teamExperienceYears,
        marketSize, setMarketSize,
        breakEven, setBreakEven, paybackMonths, setPaybackMonths,
        hasPreviousFunding, setHasPreviousFunding, fundingHistoryDetails, setFundingHistoryDetails,
        milestones,
        pitchDeckFile, setPitchDeckFile,
        financialsFile, setFinancialsFile,
        legalFile, setLegalFile,
        whitepaperFile, setWhitepaperFile,
        
        isPending: isSubmitting || isConfirming, 
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone,
        handleSubmit,
        
        // Export Values for binding
        projectName, tagline, description, companyRegId, foundedDate, teamSize, 
        linkedinProfile, demoUrl, tam, sam, som, competitors, businessModel,
        burnRate, runway, revenueProj, netProfit, ebitda, valuation, recipient
    };
}