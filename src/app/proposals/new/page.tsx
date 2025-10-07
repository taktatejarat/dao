// src/app/proposals/new/page.tsx - Revised for AI Features and API Submission

"use client";

import { useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';
import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { daoRegistryAbi, accControlAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useCreateProposal } from '@/hooks/useCreateProposal';
import { toast } from 'sonner';

export default function NewProposalPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { userRole, address, registryAddress, isHydrated } = useWeb3();

    // --- Fetching required contract addresses ---
    const { data: daoAddressResult, isLoading: isDaoAddrLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.DAO],
        query: { enabled: !!registryAddress && isHydrated },
    });
    const { data: accCtrlAddressResult, isLoading: isAccCtrlAddrLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.ACC_CONTROL],
        query: { enabled: !!registryAddress && isHydrated },
    });
    const daoAddress = daoAddressResult as Address | undefined;
    const accControlAddress = accCtrlAddressResult as Address | undefined;

    // --- On-chain Role Check ---
    const { data: roleId } = useReadContract({
        address: accControlAddress,
        abi: accControlAbi,
        functionName: 'DAO_MEMBER_ROLE',
        query: { enabled: !!accControlAddress },
    });
    const { data: hasRole, isLoading: isRoleChecking } = useReadContract({
        address: accControlAddress,
        abi: accControlAbi,
        functionName: 'hasRole',
        args: [roleId as any, address as Address],
        query: { enabled: !!accControlAddress && !!address && !!roleId },
    });
    const hasBlockchainRole = !!hasRole;

    // --- UI Permissions ---
    const canAccessPage = userRole === 'startup' || userRole === 'admin';
    const canSubmitProposal = hasBlockchainRole || userRole === 'admin';

    // --- Custom Hook for Form Logic ---
    const {
        description, setDescription,
        recipient, setRecipient,
        milestoneAmounts,
        handleAddMilestone,
        handleMilestoneAmountChange,
        handleRemoveMilestone,
        // ✅ NEW: AI Features
        startupIndustry, setStartupIndustry,
        teamExperience, setTeamExperience,
        handleSubmit,
        isPending,
        isButtonDisabled,
        isFormValid
    } = useCreateProposal({ daoAddress, isFormEnabled: canSubmitProposal });

    // --- Effects for Redirection & Warnings ---
    useEffect(() => {
        if (isHydrated && !canAccessPage) {
            toast.error(t('new_proposal_page.access_denied_title'), { description: t('new_proposal_page.access_denied_desc') });
            router.push('/dashboard');
        }
    }, [isHydrated, canAccessPage, router, t]);

    const isLoading = !isHydrated || isDaoAddrLoading || isAccCtrlAddrLoading || isRoleChecking;

    if (isLoading) {
        return <AppLayout><div className="flex justify-center pt-20"><DaoLoadingSpinner /></div></AppLayout>;
    }

    if (!canAccessPage) {
        return <AppLayout><div className="flex justify-center pt-20"><p>{t('new_proposal_page.redirecting')}</p></div></AppLayout>;
    }
    
    // ✅ Change: Pass the user's address to the handler for the API to use
    const onFormSubmit = (e: React.FormEvent) => handleSubmit(e, address); 

    return (
        <AppLayout>
            {/* ✅ Change: Use the new handler */}
            <form onSubmit={onFormSubmit}> 
                <header className="mb-6">
                    <h1 className="text-3xl font-bold font-headline">{t('new_proposal_page.title')}</h1>
                    <p className="text-muted-foreground">{t('new_proposal_page.subtitle')}</p>
                </header>
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>{t('new_proposal_page.card_title')}</CardTitle>
                        <CardDescription>{t('new_proposal_page.card_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!canSubmitProposal && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('new_proposal_page.blockchain_role_missing_title')}</AlertTitle>
                                <AlertDescription>{t('new_proposal_page.blockchain_role_missing_desc')}</AlertDescription>
                            </Alert>
                        )}

                        {/* --- NEW: AI Feature Inputs (Risk Assessment Features) --- */}
                        <div className="space-y-2">
                            <Label htmlFor="startup-industry">{t('new_proposal_page.startup_industry_label')}</Label>
                            <Input id="startup-industry" placeholder={t('new_proposal_page.startup_industry_placeholder')} value={startupIndustry} onChange={(e) => setStartupIndustry(e.target.value)} disabled={isPending} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="team-experience">{t('new_proposal_page.team_experience_label')}</Label>
                            <Textarea id="team-experience" placeholder={t('new_proposal_page.team_experience_placeholder')} className="min-h-[80px]" value={teamExperience} onChange={(e) => setTeamExperience(e.target.value)} disabled={isPending} />
                        </div>
                        {/* --- END NEW AI Feature Inputs --- */}

                        <div className="space-y-2">
                            <Label htmlFor="proposal-description">{t('new_proposal_page.full_description')}</Label>
                            <Textarea id="proposal-description" placeholder={t('new_proposal_page.full_description_placeholder')} className="min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
                            <p className="text-sm text-muted-foreground">{t('new_proposal_page.off_chain_note')}</p> {/* Note for off-chain storage */}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="recipient-address">{t('new_proposal_page.recipient_address')}</Label>
                            <Input id="recipient-address" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} disabled={isPending} />
                        </div>
                        
                        <div className="space-y-4">
                            <Label>{t('new_proposal_page.funding_milestones')}</Label>
                            {milestoneAmounts.map((amount, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                                    <span className="font-bold text-lg text-muted-foreground pt-1.5">{index + 1}</span>
                                    <div className="flex-grow space-y-2">
                                        <Label className="text-sm font-normal">{t('new_proposal_page.amount')} (RYC)</Label>
                                        <Input type="number" inputMode="decimal" step="any" min={0} placeholder="1000" value={amount} onChange={(e) => handleMilestoneAmountChange(index, e.target.value)} disabled={isPending} />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="mt-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMilestone(index)} disabled={isPending}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone} disabled={isPending}>
                                <PlusCircle className="me-2 h-4 w-4" />
                                {t('new_proposal_page.add_milestone')}
                            </Button>
                        </div>
                        
                        {!isFormValid && canSubmitProposal && (
                            <Alert variant="default">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('new_proposal_page.form_incomplete_title')}</AlertTitle>
                                <AlertDescription>{t('new_proposal_page.form_incomplete_tooltip')}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                     <CardFooter>
                         <Button type="submit" className="w-full sm:w-auto" disabled={isButtonDisabled}>
                            {isPending && <DaoLoadingSpinner className="me-2"/>}
                            {t('sidebar.submit_proposal')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </AppLayout>
    );
}