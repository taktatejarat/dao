// src/app/proposals/new/page.tsx

"use client";

import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
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
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useCreateProposal } from '@/hooks/useCreateProposal';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { toast } from 'sonner';

export default function NewProposalPage() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { userRole, isHydrated, daoAddress } = useWeb3();
    const { isConnected } = useAccount();
    const { convertRycToLocalCurrency } = useCurrencyConverter();
    const direction = (locale === 'fa' || locale === 'ar') ? 'rtl' : 'ltr';
    
    const canAccessPage = userRole === 'startup' || userRole === 'admin';

    const {
        projectName, setProjectName, tagline, setTagline, website, setWebsite,
        description, setDescription, problem, setProblem, solution, setSolution,
        businessModel, setBusinessModel, startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears, teamBio, setTeamBio,
        // New fields from hook
        tam, setTam, sam, setSam, som, setSom, competitors, setCompetitors,
        burnRate, setBurnRate, revenueProj, setRevenueProj, breakEven, setBreakEven,
        
        hasPreviousFunding, setHasPreviousFunding, fundingHistoryDetails, setFundingHistoryDetails,
        recipient, setRecipient, milestones,
        setPitchDeckFile, setFinancialsFile, setLegalFile,
        isPending, isFormValid,
        handleAddMilestone, handleMilestoneChange, handleRemoveMilestone,
        handleSubmit,
    } = useCreateProposal({ 
        daoAddress: daoAddress as `0x${string}` | undefined, 
        router 
    });

    useEffect(() => {
        if (isHydrated && !canAccessPage) {
            toast.error(t('new_proposal_page.access_denied_title'));
            router.push('/dashboard');
        }
    }, [isHydrated, canAccessPage, router, t]);

    // ✅ FIX: تعریف آرایه‌ها با استفاده از i18n
    // نکته: value ها انگلیسی می‌مانند (چون در دیتابیس ذخیره می‌شوند)، اما label ها ترجمه می‌شوند
    const industries = [
        { value: "DeFi", label: t('new_proposal_page.industries.defi') },
        { value: "AI", label: t('new_proposal_page.industries.ai') },
        { value: "Gaming", label: t('new_proposal_page.industries.gaming') },
        { value: "SaaS", label: t('new_proposal_page.industries.saas') },
    ];

    const businessModels = [
        { value: "B2B", label: t('new_proposal_page.business_models.b2b') },
        { value: "B2C", label: t('new_proposal_page.business_models.b2c') },
        { value: "B2B2C", label: t('new_proposal_page.business_models.b2b2c') },
        { value: "SaaS", label: t('new_proposal_page.business_models.saas') },
        { value: "Marketplace", label: t('new_proposal_page.business_models.marketplace') },
    ];

    return (
        <AppLayout>
            <div>
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
                        {!isConnected && <Alert variant="destructive" className="mb-6"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('dashboard.connect_to_see_data_title')}</AlertTitle><AlertDescription>{t('new_proposal_page.connect_to_submit')}</AlertDescription></Alert>}
                        
                        <Tabs defaultValue="overview" className="w-full" dir={direction}>
                            <TabsList className="mb-6 h-auto p-1">
                                <TabsTrigger value="overview">{t('new_proposal_page.tabs.overview')}</TabsTrigger>
                                <TabsTrigger value="details">{t('new_proposal_page.tabs.details')}</TabsTrigger>
                                <TabsTrigger value="team">{t('new_proposal_page.tabs.team')}</TabsTrigger>
                                <TabsTrigger value="market">{t('new_proposal_page.tabs.market')}</TabsTrigger>
                                <TabsTrigger value="financials">{t('new_proposal_page.tabs.financials')}</TabsTrigger>
                                <TabsTrigger value="documents">{t('new_proposal_page.tabs.documents')}</TabsTrigger>
                            </TabsList>

                            {/* TAB 1 & 2 & 3 SAME AS BEFORE (Shortened for brevity) */}
                            <TabsContent value="overview" className="space-y-6">
                                <div className="space-y-2"><Label>{t('new_proposal_page.project_name')}</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>{t('new_proposal_page.tagline')}</Label><Input value={tagline} onChange={e => setTagline(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>{t('new_proposal_page.industry')}</Label><Select onValueChange={setStartupIndustry} value={startupIndustry}><SelectTrigger><SelectValue placeholder="Select Industry" /></SelectTrigger><SelectContent>{industries.map(i=><SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>{t('new_proposal_page.website')}</Label><Input value={website} onChange={e => setWebsite(e.target.value)} disabled={isPending} /></div>
                            </TabsContent>
                            <TabsContent value="details" className="space-y-6">
                                <div className="space-y-2"><Label>{t('new_proposal_page.full_description')}</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[100px]" disabled={isPending} /></div>
                                <div className="space-y-2"><Label>{t('new_proposal_page.problem')}</Label><Textarea value={problem} onChange={e => setProblem(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>{t('new_proposal_page.solution')}</Label><Textarea value={solution} onChange={e => setSolution(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>{t('new_proposal_page.business_model')}</Label><Select onValueChange={setBusinessModel} value={businessModel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{businessModels.map(i=><SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select></div>
                            </TabsContent>
                            <TabsContent value="team" className="space-y-6">
                                <div className="space-y-2"><Label>{t('new_proposal_page.team_experience_years_label')}</Label><Input type="number" value={teamExperienceYears} onChange={e => setTeamExperienceYears(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>{t('new_proposal_page.team_bio_label')}</Label><Textarea value={teamBio} onChange={e => setTeamBio(e.target.value)} disabled={isPending} /></div>
                            </TabsContent>
                            {/* --- TAB 4: MARKET (I18N FIXED) --- */}
                            <TabsContent value="market" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('new_proposal_page.market_stats.tam_label')}</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="1,000,000,000" 
                                            value={tam} 
                                            onChange={e => setTam(e.target.value)} 
                                            disabled={isPending} 
                                        />
                                        <p className="text-xs text-muted-foreground">{t('new_proposal_page.market_stats.tam_desc')}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('new_proposal_page.market_stats.sam_label')}</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="50,000,000" 
                                            value={sam} 
                                            onChange={e => setSam(e.target.value)} 
                                            disabled={isPending} 
                                        />
                                        <p className="text-xs text-muted-foreground">{t('new_proposal_page.market_stats.sam_desc')}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('new_proposal_page.market_stats.som_label')}</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="5,000,000" 
                                            value={som} 
                                            onChange={e => setSom(e.target.value)} 
                                            disabled={isPending} 
                                        />
                                        <p className="text-xs text-muted-foreground">{t('new_proposal_page.market_stats.som_desc')}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('new_proposal_page.competitors')}</Label>
                                    <Textarea 
                                        value={competitors} 
                                        onChange={e => setCompetitors(e.target.value)} 
                                        disabled={isPending} 
                                    />
                                </div>
                            </TabsContent>
                            {/* --- TAB 5: FINANCIALS (I18N FIXED) --- */}
                            <TabsContent value="financials" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('new_proposal_page.financial_stats.burn_rate_label')}</Label>
                                        <Input 
                                            type="number" 
                                            value={burnRate} 
                                            onChange={e => setBurnRate(e.target.value)} 
                                            disabled={isPending} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('new_proposal_page.financial_stats.revenue_label')}</Label>
                                        <Input 
                                            type="number" 
                                            value={revenueProj} 
                                            onChange={e => setRevenueProj(e.target.value)} 
                                            disabled={isPending} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('new_proposal_page.financial_stats.break_even_label')}</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="18" 
                                            value={breakEven} 
                                            onChange={e => setBreakEven(e.target.value)} 
                                            disabled={isPending} 
                                        />
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="space-y-2"><Label>{t('new_proposal_page.has_previous_funding_label')}</Label><RadioGroup onValueChange={setHasPreviousFunding} value={hasPreviousFunding} className="flex gap-4 pt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="true" id="f-yes" /><Label htmlFor="f-yes">{t('common.yes')}</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="false" id="f-no" /><Label htmlFor="f-no">{t('common.no')}</Label></div></RadioGroup></div>
                                    {hasPreviousFunding === 'true' && (<div className="space-y-2 mt-2"><Label>{t('new_proposal_page.funding_details')}</Label><Textarea value={fundingHistoryDetails} onChange={e => setFundingHistoryDetails(e.target.value)} /></div>)}
                                </div>

                                <div className="space-y-2"><Label>{t('new_proposal_page.recipient_address')}</Label><Input value={recipient} onChange={e => setRecipient(e.target.value)} disabled={isPending} /></div>
                                
                                {/* Milestones UI (Same as before) */}
                                <div className="space-y-4">
                                    <Label>{t('new_proposal_page.funding_milestones')}</Label>
                                    {milestones.map((milestone, index) => (
                                        <div key={index} className="flex items-start gap-2 md:gap-4 p-4 border rounded-lg bg-muted/50">
                                            <span className="font-bold text-lg text-muted-foreground pt-8">{index + 1}</span>
                                            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2"><Label className="text-sm font-normal">{t('new_proposal_page.milestone_name')}</Label><Input value={milestone.name} onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)} disabled={isPending} /></div>
                                                <div className="space-y-2"><Label className="text-sm font-normal">{t('new_proposal_page.duration_days')}</Label><Input type="text" inputMode="numeric" value={milestone.durationDays} onChange={(e) => handleMilestoneChange(index, 'durationDays', e.target.value)} disabled={isPending} /></div>
                                                <div className="space-y-2"><Label className="text-sm font-normal">{t('new_proposal_page.amount')} (RYC)</Label><Input type="text" inputMode="decimal" value={milestone.amount} onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)} disabled={isPending} /><p className="text-xs text-muted-foreground text-right pr-1 h-4">{milestone.amount && `≈ ${convertRycToLocalCurrency(milestone.amount)}`}</p></div>
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

                        {!isFormValid && isConnected && <Alert variant="default" className="mt-6"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('new_proposal_page.form_incomplete_title')}</AlertTitle><AlertDescription>{t('new_proposal_page.form_incomplete_tooltip')}</AlertDescription></Alert>}
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button onClick={handleSubmit} className="w-full sm:w-auto" disabled={!isFormValid || isPending || !isConnected}>
                            {isPending ? <DaoLoadingSpinner className="me-2"/> : t('new_proposal_page.submit_for_review')}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}