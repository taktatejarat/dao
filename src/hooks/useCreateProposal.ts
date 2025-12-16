// src/hooks/useCreateProposal.ts

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
    
    const toastIdRef = useRef<string | number | undefined>(undefined);
    // ✅ FIX: استفاده از useRef برای جلوگیری از اجرای چندباره
    const hasFinalizedRef = useRef(false);

    // --- Validation State ---
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentStep, setCurrentStep] = useState(1);
    const TOTAL_STEPS = 5;

    // --- Form States ---
    const [startupStage, setStartupStage] = useState<'idea' | 'revenue'>('idea');
    const [knowledgeBasedType, setKnowledgeBasedType] = useState<string>('none');
    
    // Step 1: Basics
    const [projectName, setProjectName] = useState('');
    const [tagline, setTagline] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');
    const [startupIndustry, setStartupIndustry] = useState('');

    // Step 2: Team & Company
    const [companyRegId, setCompanyRegId] = useState('');
    const [foundedDate, setFoundedDate] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const [teamExperienceYears, setTeamExperienceYears] = useState('');
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
    
    const [recipient, setRecipient] = useState<string>('');
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);

    // Step 5: Files (Hybrid: File Object OR IPFS Hash String)
    // این ساختار اجازه می‌دهد فایل‌های قبلی (هش شده) حفظ شوند مگر اینکه کاربر فایل جدید انتخاب کند
    const [pitchDeck, setPitchDeck] = useState<{ file: File | null, hash: string | null }>({ file: null, hash: null });
    const [financials, setFinancials] = useState<{ file: File | null, hash: string | null }>({ file: null, hash: null });
    const [legal, setLegal] = useState<{ file: File | null, hash: string | null }>({ file: null, hash: null });
    const [whitepaper, setWhitepaper] = useState<{ file: File | null, hash: string | null }>({ file: null, hash: null });

    // Linkage for Revision
    const [previousProposalId, setPreviousProposalId] = useState<string | null>(null);

    // Transaction States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
    const [mongoId, setMongoId] = useState<string | null>(null);

    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: txError } = useWaitForTransactionReceipt({ hash: txHash });

    // ✅ REVISION LOGIC: Load data from existing proposal
    const loadProposalForRevision = useCallback(async (id: string) => {
        const tid = toast.loading(t('toasts.loading_revision_data'));
        try {
            const res = await fetch(`/api/proposals/${id}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            
            const data = json.data;
            
            // Hydrate States
            setProjectName(data.projectName || '');
            setTagline(data.tagline || '');
            setDescription(data.description || '');
            setStartupStage(data.startupStage || 'idea');
            setKnowledgeBasedType(data.knowledgeBasedType || 'none');
            setStartupIndustry(data.startupIndustry || '');
            setWebsite(data.website || '');
            setProblem(data.problem || '');
            setSolution(data.solution || '');
            setBusinessModel(data.businessModel || '');
            
            setCompanyRegId(data.companyRegId || '');
            setFoundedDate(data.foundedDate || '');
            setTeamSize(data.teamSize || '');
            setTeamExperienceYears(data.teamExperienceYears || '');
            setLinkedinProfile(data.linkedinProfile || '');
            setDemoUrl(data.demoUrl || '');

            if (data.marketStats) {
                setTam(data.marketStats.tam || '');
                setSam(data.marketStats.sam || '');
                setSom(data.marketStats.som || '');
                setCompetitors(data.marketStats.competitors || '');
            }
            if (data.financialStats) {
                setBurnRate(data.financialStats.burnRate || '');
                setRunway(data.financialStats.runway || '');
                setRevenueProj(data.financialStats.revenueProj || '');
                setNetProfit(data.financialStats.netProfit || '');
                setEbitda(data.financialStats.ebitda || '');
                setValuation(data.financialStats.valuation || '');
                setPaybackMonths(data.financialStats.paybackMonths || '');
            }

            if (Array.isArray(data.milestones)) {
                setMilestones(data.milestones.map((m: any) => ({
                    name: m.name,
                    durationDays: m.durationDays?.toString() || '',
                    // فرض بر این است که مقدار در دیتابیس به صورت فرمت شده ذخیره شده است
                    amount: m.amount?.toString() || '' 
                })));
            }

            // Hydrate Files (Keep Hashes)
            if (data.documents) {
                if (data.documents.pitchDeck) setPitchDeck({ file: null, hash: data.documents.pitchDeck });
                if (data.documents.financials) setFinancials({ file: null, hash: data.documents.financials });
                if (data.documents.legal) setLegal({ file: null, hash: data.documents.legal });
                if (data.documents.whitepaper) setWhitepaper({ file: null, hash: data.documents.whitepaper });
            }

            setPreviousProposalId(id);
            toast.success(t('toasts.revision_data_loaded'), { id: tid });

        } catch (e) {
            console.error(e);
            toast.error(t('toasts.failed_load_revision'), { id: tid });
        }
    }, [t]);

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
            // چک کردن اینکه یا فایل جدید انتخاب شده باشد یا هش فایل قبلی وجود داشته باشد
            if (!pitchDeck.file && !pitchDeck.hash) {
                if (!silent) toast.error(t('proposals.new.validation_pitch_deck'));
                isValid = false;
            }
            if (recipient && !isAddress(recipient)) setError('recipient', 'validation.address_invalid');
        }

        setErrors(prev => ({ ...prev, ...newErrors }));
        if (!isValid && !silent) toast.warning(t('toasts.fix_errors'));
        return isValid;
    };

    // --- Helpers ---
    const handleNextStep = () => {
        setErrors({});
        if (validateStep(currentStep)) if (currentStep < TOTAL_STEPS) setCurrentStep(c => c + 1);
    };
    const handlePrevStep = () => { if (currentStep > 1) setCurrentStep(c => c - 1); };
    
    const clearError = (field: string) => {
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };
    const wrapSet = (setter: any, field: string) => (val: any) => { setter(val); clearError(field); };

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
        let allValid = true;
        for (let i = 1; i <= 5; i++) if (!validateStep(i, true)) allValid = false;
        if (!allValid) return toast.error(t('toasts.fix_errors'));
        if (!daoAddress) return toast.error(t('wallet.not_connected'));
        
        setIsSubmitting(true);
        hasFinalizedRef.current = false;
        toastIdRef.current = toast.loading(t('toasts.uploading_docs'));

        try {
            // Helper: آپلود فایل جدید یا استفاده از هش قدیمی
            const processFile = async (item: { file: File | null, hash: string | null }) => {
                if (item.file) {
                    const formData = new FormData();
                    formData.append('file', item.file);
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    if (!res.ok) throw new Error('Upload failed'); // Internal error text, caught below
                    return (await res.json()).ipfsHash;
                }
                return item.hash; // Return existing hash
            };

            const [pitchHash, finHash, legHash, wpHash] = await Promise.all([
                processFile(pitchDeck),
                processFile(financials),
                processFile(legal),
                processFile(whitepaper)
            ]);

            toast.loading(t('toasts.saving_proposal'), { id: toastIdRef.current });
            
            const fullProposalData = {
                type: 'funding', startupStage, knowledgeBasedType, proposerAddress: address, 
                projectName, tagline, website, description, problem, solution, businessModel, startupIndustry, 
                teamExperienceYears, marketStats: { marketSize, tam, sam, som, competitors },
                financialStats: { burnRate, runway, revenueProj, breakEven, ebitda, netProfit, valuation, paybackMonths },
                recipient: recipient || address, milestones,
                documents: { pitchDeck: pitchHash, financials: finHash, legal: legHash, whitepaper: wpHash },
                extraData: { companyRegId, foundedDate, teamSize, demoUrl, linkedinProfile },
                // Linkage Data
                previousProposalId: previousProposalId || null,
                revisionReason: previousProposalId ? t('proposals.new.default_revision_reason') : null
            };

            const apiRes = await fetch('/api/proposals/submit', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullProposalData),
            });
            const apiData = await apiRes.json();
            if (!apiRes.ok) throw new Error(apiData.message);
            setMongoId(apiData.mongoId);

            toast.loading(t('toasts.confirm_in_wallet'), { id: toastIdRef.current });
            const hash = await writeContractAsync({
                address: daoAddress, abi: rayanChainDaoAbi,
                functionName: 'submitFundingProposal', args: apiData.txArgs, 
            });
            
            toast.loading(t('toasts.waiting_for_confirmation'), { id: toastIdRef.current });
            setTxHash(hash);

        } catch (error) {
            console.error(error);
            toast.error(t('toasts.submission_failed'), { id: toastIdRef.current, description: (error as Error).message });
            setIsSubmitting(false);
            setTxHash(undefined);
        }
    }, [daoAddress, address, writeContractAsync, t, validateStep, startupStage,
        knowledgeBasedType, projectName, tagline, website, description, problem,
        solution, businessModel, startupIndustry, teamExperienceYears, marketSize,
        tam, sam, som, competitors, burnRate, revenueProj, breakEven, runway,
        ebitda, netProfit, valuation, paybackMonths, recipient, milestones, 
        pitchDeck, financials, legal, whitepaper, companyRegId, foundedDate,
        teamSize, demoUrl, linkedinProfile, previousProposalId]);

    // --- Post Transaction ---
    useEffect(() => {
        // شرط خروج: اگر تراکنش تایید نشده یا قبلاً نهایی شده، خارج شو
        if (!isConfirmed || !txHash || !receipt || !mongoId || hasFinalizedRef.current) return;

        const finalizeProposal = async () => {
            hasFinalizedRef.current = true; // قفل کردن بلافاصله برای جلوگیری از تکرار

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
                hasFinalizedRef.current = false;
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
        errors, currentStep, TOTAL_STEPS, handleNextStep, handlePrevStep,
        
        // Data Setters
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

        // File Setters (Hybrid)
        setPitchDeck: (f: File | null) => setPitchDeck({ file: f, hash: null }),
        setFinancials: (f: File | null) => setFinancials({ file: f, hash: null }),
        setLegal: (f: File | null) => setLegal({ file: f, hash: null }),
        setWhitepaper: (f: File | null) => setWhitepaper({ file: f, hash: null }),

        // States & Values
        startupStage, setStartupStage,
        knowledgeBasedType, setKnowledgeBasedType,
        website, setWebsite,
        problem, setProblem, solution, setSolution, 
        startupIndustry, teamExperienceYears,
        marketSize, setMarketSize,
        breakEven, setBreakEven, paybackMonths, setPaybackMonths,
        milestones,
        
        // Expose Files for UI (File name or "Preserved")
        pitchDeckFile: pitchDeck.file || (pitchDeck.hash ? { name: t('proposals.new.file_preserved') } : null),
        financialsFile: financials.file || (financials.hash ? { name: t('proposals.new.file_preserved') } : null),
        legalFile: legal.file || (legal.hash ? { name: t('proposals.new.file_preserved') } : null),
        whitepaperFile: whitepaper.file || (whitepaper.hash ? { name: t('proposals.new.file_preserved') } : null),
        
        isPending: isSubmitting || isConfirming, 
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone,
        handleSubmit,
        loadProposalForRevision, // Exported for Page usage
        
        projectName, tagline, description, companyRegId, foundedDate, teamSize, 
        linkedinProfile, demoUrl, tam, sam, som, competitors, businessModel,
        burnRate, runway, revenueProj, netProfit, ebitda, valuation, recipient
    };
}