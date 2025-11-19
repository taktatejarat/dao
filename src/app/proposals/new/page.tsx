// src/app/proposals/new/page.tsx - FINAL, CLEANED, AND HOOK-DRIVEN VERSION

"use client";

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
// --- تمام کامپوننت‌های UI شما در اینجا ایمپورت می‌شوند ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileInput } from '@/components/ui/file-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';
// --- ایمپورت‌های اصلی منطق ---
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { useRouter } from 'next/navigation';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useCreateProposal } from '@/hooks/useCreateProposal'; // ✅ فقط این هوک برای منطق فرم
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { toast } from 'sonner';
import { Hex, decodeEventLog, encodeEventTopics, AbiEvent } from 'viem';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';


export default function NewProposalPage() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { userRole, isHydrated, daoAddress } = useWeb3();
    // ✅✅✅ DEBUGGING LOG (مرحله ۲) ✅✅✅
    useEffect(() => {
        console.log("--- 2. [NewProposalPage] HOOK INITIALIZATION ---");
        console.log("   - DAO Address passed to useCreateProposal hook:", daoAddress);
        console.log("----------------------------------------------------");
    }, [daoAddress]);
    // ✅✅✅ DEBUGGING LOG (مرحله ۲)پایان ✅✅✅
    const { isConnected } = useAccount();
    const { convertRycToLocalCurrency } = useCurrencyConverter();
    const direction = (locale === 'fa' || locale === 'ar') ? 'rtl' : 'ltr';
    const canAccessPage = userRole === 'startup' || userRole === 'admin';
    const canSubmitProposal = canAccessPage && isConnected;

    // ✅✅✅ تمام منطق فرم اکنون از یک هوک مرکزی و تمیز می‌آید ✅✅✅
    const {
        // States
        projectName, setProjectName, tagline, setTagline, website, setWebsite,
        description, setDescription, problem, setProblem, solution, setSolution,
        businessModel, setBusinessModel, startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears, teamBio, setTeamBio,
        marketSize, setMarketSize, competitors, setCompetitors,
        hasPreviousFunding, setHasPreviousFunding, fundingHistoryDetails, setFundingHistoryDetails,
        recipient, setRecipient, milestones,
        setPitchDeckFile, setFinancialsFile, setLegalFile,
        isPending, setIsPending, isFormValid,
        // Handlers
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone, handleSubmit,
    } = useCreateProposal({ daoAddress: daoAddress as Hex }); 

    // --- State های محلی فقط برای مدیریت جریان تراکنش ---
    const [txHash, setTxHash] = useState<Hex | undefined>();
    const { data: receipt, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

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
        { value: "B2B2C", label: "B2B2C" },
        { value: "SaaS", label: "SaaS" },
        { value: "Marketplace", label: "Marketplace" },
    ];

    // --- Handler wrapper for form submission ---
    const handleFormSubmit = async (e: React.FormEvent) => {
        // handleSubmit از هوک فراخوانی می‌شود و رویداد به آن پاس داده می‌شود
        const resultHash = await handleSubmit(e);
        if (resultHash) {
            setTxHash(resultHash); // نتیجه (که خود هش است) در state قرار می‌گیرد
        }
    };

    // --- Effects for Redirection & AI Trigger ---
    useEffect(() => {
        if (isHydrated && !canAccessPage) {
            toast.error(t('new_proposal_page.access_denied_title'), { description: t('new_proposal_page.access_denied_desc') });
            router.push('/dashboard');
        }
    }, [isHydrated, canAccessPage, router, t]);

    useEffect(() => {
        if (isConfirmed && receipt && txHash) {
            const toastId = 'submit-toast';
            try {
                const proposalCreatedEvent = rayanChainDaoAbi.find(item => item.type === 'event' && item.name === 'ProposalCreated') as AbiEvent | undefined;
                if (!proposalCreatedEvent) throw new Error(t('toasts.error_abi_event_not_found'));

                const proposalCreatedLog = receipt.logs.find(log => log.topics[0] === encodeEventTopics({ abi: [proposalCreatedEvent] })[0]);
                if (!proposalCreatedLog) throw new Error(t('toasts.error_tx_log_not_found'));
                
                const decodedLog = decodeEventLog({ abi: rayanChainDaoAbi, data: proposalCreatedLog.data, topics: proposalCreatedLog.topics });
                if (decodedLog.eventName !== 'ProposalCreated' || !('id' in decodedLog.args)) throw new Error(t('toasts.error_decode_proposal_id_failed'));
                
                const proposalId = decodedLog.args.id;
                
                // --- STEP 4: ساخت آبجکت کامل aiFeatures برای ارسال ---
                const fullAiFeatures = {
                    industry: startupIndustry,
                    team_experience_years: parseInt(teamExperienceYears, 10) || 0,
                    has_previous_funding: hasPreviousFunding === 'true',
                    market_size_usd: parseInt(marketSize, 10) || 0,
                    team_bio: teamBio,
                };
                
                // --- STEP 5: فراخوانی API برای فعال‌سازی تحلیل هوش مصنوعی ---
                fetch('/api/trigger-ai-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        proposalId: Number(proposalId), // تبدیل BigInt به Number برای JSON
                        aiFeatures: fullAiFeatures,
                        // در صورت نیاز می‌توانید داده‌های دیگر را نیز ارسال کنید
                        // milestones: milestones, 
                    }),
                }).then(res => {
                    if (!res.ok) {
                        // حتی اگر AI فیل شد، ثبت پروپوزال موفق بوده است
                        toast.warning(t('toasts.ai_trigger_failed'), {
                            id: toastId,
                            description: t('toasts.ai_trigger_failed_desc')
                        });
                    }
                });
                
                // --- STEP 6: اطلاع‌رسانی نهایی به کاربر و هدایت ---
                toast.success(t('toasts.proposal_created_success'), {
                    id: toastId,
                    description: t('toasts.proposal_created_desc')
                });
                
                setIsPending(false);
                // هدایت کاربر به صفحه جزئیات پروپوزال جدید
                setTimeout(() => router.push(`/proposals/${proposalId.toString()}`), 3000);

            } catch (error) {
                // اگر خطایی در پردازش receipt (که بسیار بعید است) رخ دهد
                console.error("Error processing transaction receipt:", error);
                toast.error(t('toasts.submission_failed'), {
                    id: toastId,
                    description: (error as Error).message
                });
                setIsPending(false);
            }
        }
    }, [
        isConfirmed, receipt, txHash, router, t,
        // افزودن تمام state های مورد نیاز برای ارسال به AI
        startupIndustry, teamExperienceYears, hasPreviousFunding, marketSize, teamBio
    ]);

    const isButtonDisabled = !isFormValid || isPending;

    return (
        <AppLayout>
            <form onSubmit={handleFormSubmit}>
                <header className="mb-6">
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('new_proposal_page.title')}</h1>
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

                        {!isFormValid && canSubmitProposal && (
                            <Alert variant="default" className="mt-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('new_proposal_page.form_incomplete_title')}</AlertTitle>
                                <AlertDescription>{t('new_proposal_page.form_incomplete_tooltip')}</AlertDescription>
                            </Alert>
                        )}
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