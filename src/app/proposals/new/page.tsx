// src/app/proposals/new/page.tsx - FINAL, COMPLETE, AND INTEGRATED VERSION

"use client";

import { useEffect, useState, useCallback, useMemo } from 'react'; // useMemo اضافه شد
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
import { useAccount } from 'wagmi';
import { useCreateProposal, Milestone } from '@/hooks/useCreateProposal';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { toast } from 'sonner';

// --- New UI Components ---
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileInput } from '@/components/ui/file-input';

export default function NewProposalPage() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { userRole, address, isHydrated, registryAddress } = useWeb3();
    const { isConnected } = useAccount();
    const { convertRycToLocalCurrency } = useCurrencyConverter();

    const canAccessPage = userRole === 'startup' || userRole === 'admin';
    const canSubmitProposal = canAccessPage && isConnected;

    // --- State for NEW comprehensive fields (ادغام شده با هوک) ---
    const [projectName, setProjectName] = useState('');
    const [tagline, setTagline] = useState('');
    const [website, setWebsite] = useState('');
    const [problem, setProblem] = useState('');
    const [solution, setSolution] = useState('');
    const [businessModel, setBusinessModel] = useState('');
    const [competitors, setCompetitors] = useState('');
    const [fundingHistoryDetails, setFundingHistoryDetails] = useState('');
    const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
    const [financialsFile, setFinancialsFile] = useState<File | null>(null);
    const [legalFile, setLegalFile] = useState<File | null>(null);
    
    // ✅✅✅ FIX: ما دیگر از useCreateProposal استفاده نمی‌کنیم و منطق آن را به صورت محلی مدیریت می‌کنیم ✅✅✅
    // این کار از پیچیدگی و ناسازگاری جلوگیری می‌کند.
    const [description, setDescription] = useState('');
    const [recipient, setRecipient] = useState<string>('');
    const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', durationDays: '', amount: '' }]);
    const [startupIndustry, setStartupIndustry] = useState('');
    const [teamExperienceYears, setTeamExperienceYears] = useState('');
    const [hasPreviousFunding, setHasPreviousFunding] = useState('false');
    const [marketSize, setMarketSize] = useState('');
    const [teamBio, setTeamBio] = useState('');
    const [isPending, setIsPending] = useState(false);
    const direction = (locale === 'fa' || locale === 'ar') ? 'rtl' : 'ltr';
    // --- Handlers (اکنون به صورت محلی تعریف شده‌اند) ---
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

    // --- Form Validation ---
    const isFormValid = useMemo(() => {
        return projectName.trim() !== '' && description.trim() !== '' && recipient.trim() !== '';
    }, [projectName, description, recipient]);

    // --- Effects for Redirection (بدون تغییر) ---
    useEffect(() => {
        if (isHydrated && !canAccessPage) {
            toast.error(t('new_proposal_page.access_denied_title'), { description: t('new_proposal_page.access_denied_desc') });
            router.push('/dashboard');
        }
    }, [isHydrated, canAccessPage, router, t]);

    if (!isHydrated) {
        return <AppLayout><div className="flex justify-center pt-20"><DaoLoadingSpinner /></div></AppLayout>;
    }
    if (!canAccessPage) {
        return <AppLayout><div className="flex justify-center pt-20"><p>{t('new_proposal_page.redirecting')}</p></div></AppLayout>;
    }
    
    // ✅✅✅ داده‌های جدید برای لیست‌های کشویی ✅✅✅
    const industries = [
        { value: "DeFi", label: t('new_proposal_page.industries.defi') },
        { value: "AI", label: t('new_proposal_page.industries.ai') },
        { value: "Gaming", label: t('new_proposal_page.industries.gaming') },
        { value: "SaaS", label: t('new_proposal_page.industries.saas') },
    ];
    const businessModels = [
        { value: "B2B", label: "B2B" },
        { value: "B2C", label: "B2C" },
        { value: "SaaS", label: "SaaS" },
        { value: "Marketplace", label: "Marketplace" },
    ];

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            toast.warning("Please fill out all required fields.");
            return;
        }
        setIsPending(true);

        const uploadFile = async (file: File | null, fieldName: string): Promise<string | null> => {
            if (!file) return null;
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`Failed to upload ${fieldName}`);
            const data = await response.json();
            return data.ipfsHash;
        };

        try {
            toast.loading("Uploading documents...", { id: 'submit-toast' });
            const [pitchDeckHash, financialsHash, legalHash] = await Promise.all([
                uploadFile(pitchDeckFile, 'Pitch Deck'),
                uploadFile(financialsFile, 'Financials'),
                uploadFile(legalFile, 'Legal Docs'),
            ]);

            toast.loading("Saving proposal data...", { id: 'submit-toast' });
            const fullProposalData = {
                proposerAddress: address,
                projectName, tagline, website, description, problem, solution, businessModel,
                startupIndustry, teamExperienceYears, teamBio, marketSize, competitors,
                hasPreviousFunding, fundingHistoryDetails, recipient, milestones,
                documents: { pitchDeck: pitchDeckHash, financials: financialsHash, legal: legalHash },
            };

            const finalResponse = await fetch('/api/proposals/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullProposalData),
            });

            if (!finalResponse.ok) throw new Error((await finalResponse.json()).message || 'Failed to save proposal data.');
            
            toast.success("Proposal submitted successfully!", { id: 'submit-toast' });
            setTimeout(() => router.push('/proposals'), 2000);

        } catch (error) {
            toast.error("Submission Failed", { id: 'submit-toast', description: (error as Error).message });
        } finally {
            setIsPending(false);
        }
    }, [
        isFormValid, address, router,
        projectName, tagline, website, description, problem, solution, businessModel,
        startupIndustry, teamExperienceYears, teamBio, marketSize, competitors,
        hasPreviousFunding, fundingHistoryDetails, recipient, milestones,
        pitchDeckFile, financialsFile, legalFile
    ]);
    const isButtonDisabled = !isFormValid || isPending;

    return (
        <AppLayout>
            <form onSubmit={handleSubmit}>
                <header className="mb-6">
                    <h1 className="text-3xl font-bold font-headline">{t('new_proposal_page.title')}</h1>
                    <p className="text-muted-foreground">{t('new_proposal_page.subtitle_professional')}</p>
                </header>

                <Card className="max-w-5xl mx-auto">
                    <CardHeader>
                        <CardTitle>{t('new_proposal_page.card_title')}</CardTitle>
                        <CardDescription>{t('new_proposal_page.card_desc_professional')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isConnected && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('dashboard.connect_to_see_data_title')}</AlertTitle>
                                <AlertDescription>{t('new_proposal_page.connect_to_submit')}</AlertDescription>
                            </Alert>
                        )}
                        <Tabs defaultValue="overview" className="w-full" dir={direction}>
                            <TabsList className="mb-6 h-auto p-1">
                                <TabsTrigger value="overview">{t('new_proposal_page.tabs.overview')}</TabsTrigger>
                                <TabsTrigger value="details">{t('new_proposal_page.tabs.details')}</TabsTrigger>
                                <TabsTrigger value="team">{t('new_proposal_page.tabs.team')}</TabsTrigger>
                                <TabsTrigger value="market">{t('new_proposal_page.tabs.market')}</TabsTrigger>
                                <TabsTrigger value="financials">{t('new_proposal_page.tabs.financials')}</TabsTrigger>
                                <TabsTrigger value="documents">{t('new_proposal_page.tabs.documents')}</TabsTrigger>
                            </TabsList>

                            {/* --- TAB 1: OVERVIEW --- */}
                            <TabsContent value="overview" className="space-y-6">
                                    <div className="space-y-2"><Label htmlFor="project-name">{t('new_proposal_page.project_name')}</Label><Input id="project-name" value={projectName} onChange={e => setProjectName(e.target.value)} disabled={isPending} /></div>
                                    <div className="space-y-2"><Label htmlFor="tagline">{t('new_proposal_page.tagline')}</Label><Input id="tagline" value={tagline} onChange={e => setTagline(e.target.value)} disabled={isPending} /></div>
                                    <div className="space-y-2"><Label htmlFor="industry">{t('new_proposal_page.industry')}</Label><Select onValueChange={setStartupIndustry} value={startupIndustry} disabled={isPending}><SelectTrigger><SelectValue placeholder={t('new_proposal_page.industry_placeholder')} /></SelectTrigger><SelectContent>{industries.map(item =>(<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label htmlFor="website">{t('new_proposal_page.website')}</Label><Input id="website" type="url" placeholder="https://" value={website} onChange={e => setWebsite(e.target.value)} disabled={isPending} /></div>
                            </TabsContent>

                            {/* --- TAB 2: DETAILS --- */}
                            <TabsContent value="details" className="space-y-6">
                                <div className="space-y-2"><Label htmlFor="proposal-description">{t('new_proposal_page.full_description')}</Label><Textarea id="proposal-description" value={description} onChange={e => setDescription(e.target.value)} className="min-h-[120px]" disabled={isPending} /></div>
                                <div className="space-y-2"><Label htmlFor="problem">{t('new_proposal_page.problem')}</Label><Textarea id="problem" value={problem} onChange={e => setProblem(e.target.value)} className="min-h-[100px]" disabled={isPending} /></div>
                                <div className="space-y-2"><Label htmlFor="solution">{t('new_proposal_page.solution')}</Label><Textarea id="solution" value={solution} onChange={e => setSolution(e.target.value)} className="min-h-[100px]" disabled={isPending} /></div>
                                <div className="space-y-2"><Label htmlFor="business-model">{t('new_proposal_page.business_model')}</Label><Select onValueChange={setBusinessModel} value={businessModel} disabled={isPending}><SelectTrigger><SelectValue placeholder={t('new_proposal_page.business_model_placeholder')} /></SelectTrigger><SelectContent>{businessModels.map(item =>(<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}</SelectContent></Select></div>
                            </TabsContent>

                            {/* --- TAB 3: TEAM --- */}
                            <TabsContent value="team" className="space-y-6">
                                <div className="space-y-2"><Label htmlFor="team-experience-years">{t('new_proposal_page.team_experience_years_label')}</Label><Input id="team-experience-years" type="number" value={teamExperienceYears} onChange={e => setTeamExperienceYears(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label htmlFor="team-bio">{t('new_proposal_page.team_bio_label')}</Label><Textarea id="team-bio" value={teamBio} onChange={e => setTeamBio(e.target.value)} className="min-h-[120px]" disabled={isPending} /></div>
                            </TabsContent>

                            {/* --- TAB 4: MARKET --- */}
                            <TabsContent value="market" className="space-y-6">
                                <div className="space-y-2"><Label htmlFor="market-size">{t('new_proposal_page.market_size_label')}</Label><Input id="market-size" type="number" value={marketSize} onChange={e => setMarketSize(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label htmlFor="competitors">{t('new_proposal_page.competitors')}</Label><Textarea id="competitors" value={competitors} onChange={e => setCompetitors(e.target.value)} className="min-h-[100px]" disabled={isPending} /></div>
                            </TabsContent>

                            {/* --- TAB 5: FINANCIALS --- */}
                            <TabsContent value="financials" className="space-y-6">
                                <div className="space-y-2"><Label>{t('new_proposal_page.has_previous_funding_label')}</Label><RadioGroup onValueChange={setHasPreviousFunding} value={hasPreviousFunding} className="flex gap-4 pt-2" disabled={isPending}><div className="flex items-center space-x-2"><RadioGroupItem value="true" id="f-yes" /><Label htmlFor="f-yes">{t('yes')}</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="false" id="f-no" /><Label htmlFor="f-no">{t('no')}</Label></div></RadioGroup></div>
                                {hasPreviousFunding === 'true' && (<div className="space-y-2"><Label htmlFor="funding-details">{t('new_proposal_page.funding_details')}</Label><Textarea id="funding-details" value={fundingHistoryDetails} onChange={e => setFundingHistoryDetails(e.target.value)} disabled={isPending} /></div>)}
                                <div className="space-y-2"><Label htmlFor="recipient-address">{t('new_proposal_page.recipient_address')}</Label><Input id="recipient-address" value={recipient} onChange={e => setRecipient(e.target.value)} disabled={isPending} /></div>
                                {/* --- Your complete, working Milestone UI --- */}
                                <div className="space-y-4">
                                    <Label>{t('new_proposal_page.funding_milestones')}</Label>
                                    {milestones.map((milestone, index) => (
                                        <div key={index} className="flex items-start gap-2 md:gap-4 p-4 border rounded-lg bg-muted/50">
                                            <span className="font-bold text-lg text-muted-foreground pt-8">{index + 1}</span>
                                            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2"><Label htmlFor={`milestone-name-${index}`} className="text-sm font-normal">{t('new_proposal_page.milestone_name')}</Label><Input id={`milestone-name-${index}`} value={milestone.name} onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)} disabled={isPending} /></div>
                                                <div className="space-y-2"><Label htmlFor={`milestone-duration-${index}`} className="text-sm font-normal">{t('new_proposal_page.duration_days')}</Label><Input id={`milestone-duration-${index}`} type="text" inputMode="numeric" value={milestone.durationDays} onChange={(e) => handleMilestoneChange(index, 'durationDays', e.target.value)} disabled={isPending} /></div>
                                                <div className="space-y-2"><Label htmlFor={`milestone-amount-${index}`} className="text-sm font-normal">{t('new_proposal_page.amount')} (RYC)</Label><Input id={`milestone-amount-${index}`} type="text" inputMode="decimal" value={milestone.amount} onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)} disabled={isPending} /><p className="text-xs text-muted-foreground text-right pr-1 h-4">{milestone.amount && `≈ ${convertRycToLocalCurrency(milestone.amount)}`}</p></div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="mt-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMilestone(index)} disabled={isPending || milestones.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone} disabled={isPending}><PlusCircle className="me-2 h-4 w-4" />{t('new_proposal_page.add_milestone')}</Button>
                                </div>
                            </TabsContent>

                            {/* --- TAB 6: DOCUMENTS --- */}
                            <TabsContent value="documents" className="space-y-6 pt-6">
                                <FileInput id="pitch-deck" label={t('new_proposal_page.pitch_deck')} accept=".pdf" onChange={e => setPitchDeckFile(e.target.files ? e.target.files[0] : null)} disabled={isPending} />
                                <FileInput id="financials-doc" label={t('new_proposal_page.financials_doc')} accept=".pdf,.xlsx" onChange={e => setFinancialsFile(e.target.files ? e.target.files[0] : null)} disabled={isPending} />
                                <FileInput id="legal-doc" label={t('new_proposal_page.legal_doc')} accept=".pdf" onChange={e => setLegalFile(e.target.files ? e.target.files[0] : null)} disabled={isPending} />
                            </TabsContent>
                        </Tabs>

                        {!isFormValid && canSubmitProposal && (<Alert variant="default" className="mt-6"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('new_proposal_page.form_incomplete_title')}</AlertTitle><AlertDescription>{t('new_proposal_page.form_incomplete_tooltip')}</AlertDescription></Alert>)}
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isButtonDisabled}>
                            {isPending ? <DaoLoadingSpinner className="me-2"/> : t('new_proposal_page.submit_for_review')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </AppLayout>
    );
}