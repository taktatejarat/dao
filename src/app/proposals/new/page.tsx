// src/app/proposals/new/page.tsx - FINAL CORRECTED WIZARD

"use client";

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileInput } from '@/components/ui/file-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { AlertTriangle, PlusCircle, Trash2, ChevronRight, ChevronLeft, Save, Paperclip, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useCreateProposal } from '@/hooks/useCreateProposal';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";
import { useLanguage } from '@/context/LanguageProvider';

// --- Helper for Type-Safe Translation ---
const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    const t = (key: string, params?: any) => (originalT as any)(key, params);
    return { t, locale };
};

export default function NewProposalPage() {
    const { t, locale } = useSafeTranslation();
    const { direction } = useLanguage();
    const router = useRouter();
    const { userRole, isHydrated, daoAddress } = useWeb3();
    const { isConnected } = useAccount();
    
    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;
    const progress = (currentStep / totalSteps) * 100;

    // Additional Files State
    const [extraFiles, setExtraFiles] = useState<{id: number, file: File | null}[]>([]);

    const canAccessPage = userRole === 'startup' || userRole === 'admin';

    // Hook Logic
    const {
        projectName, setProjectName, tagline, setTagline, website, setWebsite,
        description, setDescription, problem, setProblem, solution, setSolution,
        businessModel, setBusinessModel, startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears, teamBio, setTeamBio,
        tam, setTam, sam, setSam, som, setSom, competitors, setCompetitors,
        burnRate, setBurnRate, revenueProj, setRevenueProj, breakEven, setBreakEven,
        recipient, setRecipient, milestones,
        setPitchDeckFile, setFinancialsFile, setLegalFile, // Legal added back
        isPending, isFormValid,
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone,
        handleSubmit,
    } = useCreateProposal({ daoAddress: daoAddress as `0x${string}` | undefined, router });

    useEffect(() => {
        if (isHydrated && !canAccessPage) { toast.error(t('new_proposal_page.access_denied_title')); router.push('/dashboard'); }
    }, [isHydrated, canAccessPage, router, t]);

    // Data Lists
    const industries = [{ value: "DeFi", label: t('new_proposal_page.industries.defi') }, { value: "AI", label: t('new_proposal_page.industries.ai') }, { value: "Gaming", label: t('new_proposal_page.industries.gaming') }, { value: "SaaS", label: t('new_proposal_page.industries.saas') }];
    const businessModels = [{ value: "B2B", label: t('new_proposal_page.business_models.b2b') }, { value: "B2C", label: t('new_proposal_page.business_models.b2c') }, { value: "Marketplace", label: t('new_proposal_page.business_models.marketplace') }];

    // --- File Validation Helper ---
    const handleFileChange = (setter: (f: File | null) => void, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            if (file.size > 20 * 1024 * 1024) { // 20MB
                toast.error(t('common.file_too_large', { max: '20MB' }));
                e.target.value = ''; // Reset input
                return;
            }
            setter(file);
        }
    };

    // --- Extra Files Handlers ---
    const addExtraFileSlot = () => {
        if (extraFiles.length >= 5) {
            toast.warning(t('new_proposal_page.max_files_reached'));
            return;
        }
        setExtraFiles([...extraFiles, { id: Date.now(), file: null }]);
    };

    const removeExtraFileSlot = (id: number) => {
        setExtraFiles(extraFiles.filter(f => f.id !== id));
    };

    const handleExtraFileChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file && file.size > 20 * 1024 * 1024) {
            toast.error(t('common.file_too_large', { max: '20MB' }));
            e.target.value = '';
            return;
        }
        setExtraFiles(extraFiles.map(f => f.id === id ? { ...f, file } : f));
    };

    // --- Helper to get Step Title ---
    const getStepTitle = (step: number) => {
        switch(step) {
            case 1: return t('new_proposal_page.tabs.overview');
            case 2: return t('new_proposal_page.tabs.details');
            case 3: return t('new_proposal_page.tabs.team');
            case 4: return t('new_proposal_page.tabs.financials');
            case 5: return t('proposal_detail.milestones');
            case 6: return t('new_proposal_page.tabs.documents');
            default: return '';
        }
    };

    // --- STEP CONTENT RENDERER ---
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Overview
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-end-4 duration-300">
                        <div className="space-y-2"><Label>{t('new_proposal_page.project_name')}</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} disabled={isPending} autoFocus /></div>
                        <div className="space-y-2"><Label>{t('new_proposal_page.tagline')}</Label><Input value={tagline} onChange={e => setTagline(e.target.value)} disabled={isPending} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>{t('new_proposal_page.industry')}</Label><Select onValueChange={setStartupIndustry} value={startupIndustry}><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger><SelectContent>{industries.map(i=><SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>{t('new_proposal_page.website')}</Label><Input value={website} onChange={e => setWebsite(e.target.value)} disabled={isPending} placeholder="https://" className="text-left" dir="ltr" /></div>
                        </div>
                    </div>
                );
            case 2: // Details
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-end-4 duration-300">
                        <div className="space-y-2"><Label>{t('new_proposal_page.full_description')}</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[120px]" disabled={isPending} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>{t('new_proposal_page.problem')}</Label><Textarea value={problem} onChange={e => setProblem(e.target.value)} disabled={isPending} className="min-h-[100px]" /></div>
                            <div className="space-y-2"><Label>{t('new_proposal_page.solution')}</Label><Textarea value={solution} onChange={e => setSolution(e.target.value)} disabled={isPending} className="min-h-[100px]" /></div>
                        </div>
                        <div className="space-y-2"><Label>{t('new_proposal_page.business_model')}</Label><Select onValueChange={setBusinessModel} value={businessModel}><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger><SelectContent>{businessModels.map(i=><SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                );
            case 3: // Team & Market
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-end-4 duration-300">
                        <div className="space-y-2"><Label>{t('new_proposal_page.team_bio_label')}</Label><Textarea value={teamBio} onChange={e => setTeamBio(e.target.value)} disabled={isPending} /></div>
                        <div className="space-y-2"><Label>{t('new_proposal_page.team_experience_years_label')}</Label><Input type="number" value={teamExperienceYears} onChange={e => setTeamExperienceYears(e.target.value)} disabled={isPending} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>{t('new_proposal_page.market_stats.tam_label')}</Label><Input type="number" value={tam} onChange={e => setTam(e.target.value)} /></div>
                            <div className="space-y-2"><Label>{t('new_proposal_page.market_stats.sam_label')}</Label><Input type="number" value={sam} onChange={e => setSam(e.target.value)} /></div>
                            <div className="space-y-2"><Label>{t('new_proposal_page.market_stats.som_label')}</Label><Input type="number" value={som} onChange={e => setSom(e.target.value)} /></div>
                        </div>
                        <div className="space-y-2"><Label>{t('new_proposal_page.competitors')}</Label><Textarea value={competitors} onChange={e => setCompetitors(e.target.value)} /></div>
                    </div>
                );
            case 4: // Financials
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-end-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>{t('new_proposal_page.financial_stats.burn_rate_label')}</Label><Input type="number" value={burnRate} onChange={e => setBurnRate(e.target.value)} /></div>
                            <div className="space-y-2"><Label>{t('new_proposal_page.financial_stats.revenue_label')}</Label><Input type="number" value={revenueProj} onChange={e => setRevenueProj(e.target.value)} /></div>
                            <div className="space-y-2"><Label>{t('new_proposal_page.financial_stats.break_even_label')}</Label><Input type="number" value={breakEven} onChange={e => setBreakEven(e.target.value)} /></div>
                        </div>
                        <div className="space-y-2"><Label>{t('new_proposal_page.recipient_address')}</Label><Input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x..." className="text-left font-mono" dir="ltr" /></div>
                    </div>
                );
            case 5: // Milestones
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-end-4 duration-300">
                        {milestones.map((milestone, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-muted/30">
                                <span className="font-bold text-lg text-muted-foreground pt-2 md:pt-8 w-8 text-center">{index + 1}</span>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1"><Label className="text-xs">{t('new_proposal_page.milestone_name')}</Label><Input value={milestone.name} onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)} /></div>
                                    <div className="space-y-1"><Label className="text-xs">{t('new_proposal_page.duration_days')}</Label><Input type="number" value={milestone.durationDays} onChange={(e) => handleMilestoneChange(index, 'durationDays', e.target.value)} /></div>
                                    <div className="space-y-1"><Label className="text-xs">{t('new_proposal_page.amount')} (RYC)</Label><Input type="number" value={milestone.amount} onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)} /></div>
                                </div>
                                <Button variant="ghost" size="icon" className="self-end md:self-center" onClick={() => handleRemoveMilestone(index)} disabled={milestones.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" onClick={handleAddMilestone}><PlusCircle className="me-2 h-4 w-4" /> {t('new_proposal_page.add_milestone')}</Button>
                    </div>
                );
            case 6: // Documents
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-end-4 duration-300">
                        <Alert className="bg-primary/5 border-primary/20">
                            <AlertTitle>{t('new_proposal_page.file_limits_title')}</AlertTitle>
                            <AlertDescription>{t('new_proposal_page.file_limits_desc')}</AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileInput id="pitch" label={t('new_proposal_page.pitch_deck')} accept=".pdf" onChange={(e) => handleFileChange(setPitchDeckFile, e)} />
                            <FileInput id="financials" label={t('new_proposal_page.financials_doc')} accept=".xlsx,.csv,.pdf" onChange={(e) => handleFileChange(setFinancialsFile, e)} />
                            <FileInput id="legal" label={t('new_proposal_page.legal_doc')} accept=".pdf" onChange={(e) => handleFileChange(setLegalFile, e)} />
                        </div>

                        {/* Extra Files Section */}
                        <div className="border-t pt-4">
                            <Label className="mb-4 block">{t('new_proposal_page.additional_files')}</Label>
                            <div className="space-y-3">
                                {extraFiles.map((item, index) => (
                                    <div key={item.id} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <FileInput 
                                                id={`extra-${item.id}`} 
                                                label={`${t('common.file')} ${index + 1}`} 
                                                onChange={(e) => handleExtraFileChange(item.id, e)} 
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" className="mb-1" onClick={() => removeExtraFileSlot(item.id)}>
                                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {extraFiles.length < 5 && (
                                <Button variant="ghost" size="sm" onClick={addExtraFileSlot} className="mt-2 text-primary">
                                    <Paperclip className="me-2 h-3 w-3" /> {t('new_proposal_page.add_more_files')}
                                </Button>
                            )}
                        </div>
                        {/* هشدار فرم ناقص با رنگ نارنجی (Warning Style) */}
                        {!isFormValid && isConnected && (
                            <Alert className="mt-6 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                                <AlertTitle className="font-bold">
                                    {t('new_proposal_page.form_incomplete_title')}
                                </AlertTitle>
                                <AlertDescription className="opacity-90">
                                    {t('new_proposal_page.form_incomplete_tooltip')}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto py-8">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('new_proposal_page.title')}</h1>
                    <p className="text-muted-foreground">{t('new_proposal_page.subtitle_professional')}</p>
                </header>

                <div className="mb-8 px-1">
                    {/* ✅ FIX: Dynamic Labels based on current step & percentage */}
                    <div className="flex justify-between text-sm font-medium text-primary mb-2">
                        <span>{getStepTitle(currentStep)}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <Card className="border-primary/20 shadow-lg">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="flex justify-between items-center">
                            {/* ✅ FIX: Step Counter localized and positioned correctly via Flexbox */}
                            <span className="text-lg text-foreground">{getStepTitle(currentStep)}</span>
                            <span className="text-sm font-normal text-muted-foreground">
                                {t('common.step_counter', { current: currentStep, total: totalSteps })}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="py-6 min-h-[400px]">
                        {renderStepContent()}
                    </CardContent>

                    <CardFooter className="flex justify-between border-t pt-6 bg-muted/10">
                        <Button 
                            variant="ghost" 
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} 
                            disabled={currentStep === 1 || isPending}
                        >
                            {/* ✅ Icons automatically flip in RTL if not forced, using proper margin classes */}
                            <ChevronLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {t('common.back')}
                        </Button>

                        {currentStep < totalSteps ? (
                            <Button onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}>
                                {t('common.next')} <ChevronRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={!isFormValid || isPending} className="bg-primary">
                                {isPending ? <DaoLoadingSpinner className="me-2" /> : <Save className="me-2 h-4 w-4" />}
                                {t('new_proposal_page.submit_for_review')}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}