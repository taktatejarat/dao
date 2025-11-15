
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Address, isAddress, parseEther, BaseError, Hex } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';

// --- Type Definitions ---
export interface Milestone { name: string; durationDays: string; amount: string; }
interface UseCreateProposalProps { daoAddress: Address | undefined; }

export function useCreateProposal({ daoAddress }: UseCreateProposalProps) {
    const { address } = useAccount();
    const { t } = useTranslation();
    const { writeContractAsync } = useWriteContract();

    // --- All Form States ---
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
    const [isPending, setIsPending] = useState(false);

    // --- Form Validation ---
    const isFormValid = useMemo(() => {
        const areMilestonesValid = milestones.every(m => m.name.trim() && m.durationDays.trim() && m.amount.trim());
        return projectName.trim() !== '' &&
               description.trim().length >= 50 &&
               problem.trim().length >= 50 &&
               solution.trim().length >= 50 &&
               isAddress(recipient) &&
               areMilestonesValid;
    }, [projectName, description, problem, solution, recipient, milestones]);

    // --- Form Handlers ---
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
    const handleSubmit = useCallback(async (e: React.FormEvent): Promise<Hex | undefined> => {
        e.preventDefault(); // جلوگیری از رفرش شدن صفحه
        if (!isFormValid) {
            toast.warning(t('toasts.fill_all_fields'));
            return;
        }
        setIsPending(true);
        const toastId = 'submit-toast';;

        const uploadFile = async (file: File | null, fieldName: string): Promise<string | null> => {
            if (!file) return null;
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`${t('toasts.upload_failed')}: ${fieldName}`);
            const data = await response.json();
            return data.ipfsHash;
        };

        try {
            // STEP 1: Upload files
            toast.loading(t('toasts.uploading_docs'), { id: toastId });
            const [pitchDeckHash, financialsHash, legalHash] = await Promise.all([
                uploadFile(pitchDeckFile, 'Pitch Deck'),
                uploadFile(financialsFile, 'Financials'),
                uploadFile(legalFile, 'Legal Docs'),
            ]);

            // STEP 2: Save data off-chain and get transaction arguments
            toast.loading(t('toasts.saving_proposal'), { id: toastId });
            const fullProposalData = {
                proposerAddress: address, projectName, tagline, website, description, problem, solution, businessModel,
                startupIndustry, teamExperienceYears, teamBio, marketSize, competitors,
                hasPreviousFunding, fundingHistoryDetails, recipient, milestones,
                documents: { pitchDeck: pitchDeckHash, financials: financialsHash, legal: legalHash },
            };

            const apiResponse = await fetch('/api/proposals/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullProposalData),
            });
            
            const responseData = await apiResponse.json();
            if (!apiResponse.ok) {
                // مدیریت خطای اعتبارسنجی از Zod
                if (responseData.errors) {
                    const fieldErrors = responseData.errors.fieldErrors;
                    const firstErrorField = Object.keys(fieldErrors)[0];
                    const errorMessage = fieldErrors[firstErrorField][0];
                    const finalMessage = `${t(`new_proposal_page.${firstErrorField}`)}: ${errorMessage}`;
                    throw new Error(finalMessage);
                }
                throw new Error(responseData.message || 'API submission failed.');
            }
            
            const { txArgs } = responseData;
            if (!txArgs) {
                throw new Error("API did not return transaction arguments.");
            }

            // STEP 3: Send on-chain transaction
            toast.loading(t('toasts.confirm_in_wallet'), { id: toastId });
            const hash = await writeContractAsync({
                address: daoAddress!,
                abi: rayanChainDaoAbi,
                functionName: 'submitFundingProposal',
                args: txArgs,
            });

            // هش را برمی‌گردانیم تا کامپوننت والد از آن استفاده کند
            return hash;
            
        } catch (error) {
            toast.error(t('toasts.submission_failed'), { id: toastId, description: (error as Error).message });
            setIsPending(false);
            return undefined;
        }
    }, [
        // ... لیست کامل وابستگی‌ها
        isFormValid, address, daoAddress, writeContractAsync, t,
        projectName, tagline, website, description, problem, solution, businessModel,
        startupIndustry, teamExperienceYears, teamBio, marketSize, competitors,
        hasPreviousFunding, fundingHistoryDetails, recipient, milestones,
        pitchDeckFile, financialsFile, legalFile
    ]);

    return {
        // ... (تمام state ها و توابع setter)
        projectName, setProjectName, tagline, setTagline, website, setWebsite,
        description, setDescription, problem, setProblem, solution, setSolution,
        businessModel, setBusinessModel, startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears, teamBio, setTeamBio,
        marketSize, setMarketSize, competitors, setCompetitors,
        hasPreviousFunding, setHasPreviousFunding, fundingHistoryDetails, setFundingHistoryDetails,
        recipient, setRecipient, milestones,
        pitchDeckFile, setPitchDeckFile, financialsFile, setFinancialsFile, legalFile, setLegalFile,
        isPending, setIsPending, isFormValid,
        // Handlers
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone,
        handleSubmit,
    };
}