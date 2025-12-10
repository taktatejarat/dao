// src/app/proposals/new/page.tsx - FULLY RESPONSIVE & RTL SUPPORT

"use client";

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useWeb3 } from '@/context/Web3Provider';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useCreateProposal } from '@/hooks/useCreateProposal';
import { useTranslation } from '@/hooks/use-translation';
import { Rocket, Vote, UploadCloud, BadgeCheck, Building2, Wallet, LinkIcon, Users } from 'lucide-react';

export default function NewProposalPage() {
    const { t, locale } = useTranslation();
    const dir = locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr';
    const { userRole, address, daoAddress } = useWeb3();
    const router = useRouter();
    
    const [activeTab, setActiveTab] = useState("startup");
    
    // --- Treasury Logic ---
    const [tTitle, setTTitle] = useState('');
    const [tDesc, setTDesc] = useState('');
    const [tAmount, setTAmount] = useState('');
    const [tRecipient, setTRecipient] = useState('');
    const [tToken, setTToken] = useState('1'); 

    const { writeContractAsync, data: txHash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
    const [isSubmittingTreasury, setIsSubmittingTreasury] = useState(false);

    // --- Startup Hooks ---
    const proposalHook = useCreateProposal({ daoAddress, router });

    const handleTreasurySubmit = async () => {
        if (!address) return toast.error(t('wallet.not_connected'));
        setIsSubmittingTreasury(true);
        try {
            const res = await fetch('/api/proposals/submit', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    type: 'treasury',
                    title: tTitle,
                    description: tDesc,
                    recipient: tRecipient || address,
                    amount: tAmount,
                    tokenType: Number(tToken),
                    proposerAddress: address
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            await writeContractAsync({
                address: daoAddress!,
                abi: rayanChainDaoAbi,
                functionName: 'createTreasuryActionProposal',
                args: data.txArgs
            });
            toast.success(t('toasts.proposal_created_success'));
        } catch (e) {
            toast.error(t('toasts.submission_failed'), { description: (e as Error).message });
            setIsSubmittingTreasury(false);
        }
    };

    if (isSuccess) router.push('/proposals');

    return (
        <AppLayout>
            <div className="container max-w-7xl py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4" dir={dir}>
                
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-gradient mb-4">{t('proposals.new.title')}</h1>
                    <p className="text-muted-foreground text-lg">{t('proposals.new.subtitle')}</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="grid w-full max-w-md grid-cols-2 h-14 p-1 bg-muted/50 rounded-full">
                            <TabsTrigger value="startup" className="rounded-full text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <Rocket className="w-4 h-4 mr-2 rtl:ml-2" /> {t('proposals.new.tab_startup')}
                            </TabsTrigger>
                            <TabsTrigger value="treasury" disabled={userRole !== 'admin'} className="rounded-full text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <Vote className="w-4 h-4 mr-2 rtl:ml-2" /> {t('proposals.new.tab_treasury')}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ================= STARTUP FUNDING WIZARD ================= */}
                    <TabsContent value="startup">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* --- SIDEBAR (Fixed RTL Alignment) --- */}
                            <div className="lg:col-span-4 space-y-6 h-fit lg:sticky lg:top-24">
                                <Card className="border-primary/20 shadow-md">
                                    <CardHeader className="bg-primary/5 pb-4 border-b">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-primary"/> {t('proposals.new.stage_title')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        {/* ✅ FIX: اضافه کردن items-start و text-start برای اصلاح جهت */}
                                        <div className="space-y-3">
                                            <RadioGroup defaultValue="idea" value={proposalHook.startupStage} onValueChange={(v: any) => proposalHook.setStartupStage(v)}>
                                                {/* Option 1 */}
                                                <div className="flex items-start gap-3 rtl:flex-row-reverse border p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                                                    <RadioGroupItem value="idea" id="r1" className="mt-1" />
                                                    <Label htmlFor="r1" className="cursor-pointer flex-1 text-start rtl:text-right">
                                                        <span className="font-bold block text-base">{t('proposals.new.stage_idea')}</span>
                                                        <span className="text-xs text-muted-foreground">{t('proposals.new.stage_idea_desc')}</span>
                                                    </Label>
                                                </div>
                                                {/* Option 2 */}
                                                <div className="flex items-start gap-3 rtl:flex-row-reverse border p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                                                    <RadioGroupItem value="revenue" id="r2" className="mt-1" />
                                                    <Label htmlFor="r2" className="cursor-pointer flex-1 text-start rtl:text-right">
                                                        <span className="font-bold block text-base">{t('proposals.new.stage_revenue')}</span>
                                                        <span className="text-xs text-muted-foreground">{t('proposals.new.stage_revenue_desc')}</span>
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        {/* Knowledge Based Selection */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-sm font-medium">
                                                <BadgeCheck className="w-4 h-4 text-amber-500" /> 
                                                {t('proposals.new.kb_title')}
                                            </Label>
                                            {/* ✅ FIX: کلاس text-start برای سلکت باکس */}
                                            <Select value={proposalHook.knowledgeBasedType} onValueChange={proposalHook.setKnowledgeBasedType}>
                                                <SelectTrigger className="h-11 text-start justify-between">
                                                    <SelectValue placeholder={t('proposals.new.select_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none" className="text-start">{t('proposals.new.kb_none')}</SelectItem>
                                                    <SelectItem value="type1" className="text-start">{t('proposals.new.kb_type1')}</SelectItem>
                                                    <SelectItem value="type2" className="text-start">{t('proposals.new.kb_type2')}</SelectItem>
                                                    <SelectItem value="creative" className="text-start">{t('proposals.new.kb_creative')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* File Uploads */}
                                <Card>
                                    <CardHeader className="pb-3 border-b"><CardTitle className="text-sm font-bold text-muted-foreground">{t('proposals.new.docs_title')}</CardTitle></CardHeader>
                                    <CardContent className="pt-4 grid gap-3">
                                        <Button variant="outline" className="w-full justify-start h-12 text-sm" onClick={() => document.getElementById('file-pitch')?.click()}>
                                            <UploadCloud className="w-4 h-4 mr-3 rtl:ml-3" /> 
                                            {t('proposals.new.upload_pitch')} 
                                            {proposalHook.pitchDeckFile ? <span className="text-green-600 ml-auto font-bold text-xs rtl:mr-auto rtl:ml-0">✔</span> : <span className="text-muted-foreground ml-auto text-xs rtl:mr-auto rtl:ml-0">{t('proposals.new.required')}</span>}
                                        </Button>
                                        <input id="file-pitch" type="file" className="hidden" onChange={(e) => proposalHook.setPitchDeckFile(e.target.files?.[0] || null)} />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- MAIN FORM --- */}
                            <div className="lg:col-span-8 space-y-8">
                                
                                {/* 1. Project Basic Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl">{t('proposals.new.project_details')}</CardTitle>
                                        <CardDescription>{t('proposals.new.project_details_desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_name')}</Label>
                                                <Input className="h-12 text-start" placeholder={t('proposals.new.ph_name')} value={proposalHook.projectName} onChange={e => proposalHook.setProjectName(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_tagline')}</Label>
                                                <Input className="h-12 text-start" placeholder={t('proposals.new.ph_tagline')} value={proposalHook.tagline} onChange={e => proposalHook.setTagline(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('proposals.new.lbl_problem_solution')}</Label>
                                            <Textarea className="min-h-[140px] text-start resize-y" placeholder={t('proposals.new.ph_problem_solution')} value={proposalHook.description} onChange={e => proposalHook.setDescription(e.target.value)} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 2. ✅ NEW: Company & Team Info (Professional Fields) */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl">{t('proposals.new.company_info')}</CardTitle>
                                        <CardDescription>{t('proposals.new.company_info_desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_company_reg_id')}</Label>
                                                <Input className="h-11 text-start" value={proposalHook.companyRegId} onChange={e => proposalHook.setCompanyRegId(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_founded_date')}</Label>
                                                <Input className="h-11 text-start" type="date" value={proposalHook.foundedDate} onChange={e => proposalHook.setFoundedDate(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_team_size')}</Label>
                                                <div className="relative">
                                                    <Users className="absolute left-3 rtl:right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                    <Input className="h-11 text-start pl-9 rtl:pr-9 rtl:pl-3" type="number" value={proposalHook.teamSize} onChange={e => proposalHook.setTeamSize(e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_demo_url')}</Label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 rtl:right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                    <Input className="h-11 text-start pl-9 rtl:pr-9 rtl:pl-3" placeholder="https://" dir="ltr" value={proposalHook.demoUrl} onChange={e => proposalHook.setDemoUrl(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_linkedin')}</Label>
                                                <Input className="h-11 text-start" placeholder="linkedin.com/in/..." dir="ltr" value={proposalHook.linkedinProfile} onChange={e => proposalHook.setLinkedinProfile(e.target.value)} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 3. Market & Financials (Dynamic & Expanded) */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl">{t('proposals.new.market_financials')}</CardTitle>
                                        <CardDescription>
                                            {proposalHook.startupStage === 'idea' ? t('proposals.new.market_desc_idea') : t('proposals.new.market_desc_revenue')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_tam')}</Label>
                                                <Input type="number" className="h-11 text-start" placeholder="0" value={proposalHook.tam} onChange={e => proposalHook.setTam(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_sam')}</Label>
                                                <Input type="number" className="h-11 text-start" placeholder="0" value={proposalHook.sam} onChange={e => proposalHook.setSam(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.lbl_som')}</Label>
                                                <Input type="number" className="h-11 text-start" placeholder="0" value={proposalHook.som} onChange={e => proposalHook.setSom(e.target.value)} />
                                            </div>
                                        </div>

                                        {/* Conditional Fields Based on Stage */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                            {proposalHook.startupStage === 'idea' ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>{t('proposals.new.lbl_burn_rate')}</Label>
                                                        <Input type="number" className="h-11 text-start" value={proposalHook.burnRate} onChange={e => proposalHook.setBurnRate(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>{t('proposals.new.lbl_runway')}</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-11 text-start"
                                                            value={proposalHook.runway}
                                                            onChange={e => proposalHook.setRunway(e.target.value)}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* ✅ فیلدهای مالی پیشرفته برای استارتاپ‌های فعال */}
                                                    <div className="space-y-2">
                                                        <Label>{t('proposals.new.lbl_revenue')}</Label>
                                                        <Input type="number" className="h-11 text-start" value={proposalHook.revenueProj} onChange={e => proposalHook.setRevenueProj(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>{t('proposals.new.lbl_net_profit')}</Label>
                                                        <Input type="number" className="h-11 text-start" value={proposalHook.netProfit} onChange={e => proposalHook.setNetProfit(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>{t('proposals.new.lbl_ebitda')}</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-11 text-start"
                                                            placeholder="%"
                                                            value={proposalHook.ebitda}
                                                            onChange={e => proposalHook.setEbitda(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Payback Period (months)</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-11 text-start"
                                                            placeholder="e.g. 12"
                                                            value={proposalHook.paybackMonths}
                                                            onChange={e => proposalHook.setPaybackMonths(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>{t('proposals.new.lbl_valuation')}</Label>
                                                        <Input type="number" className="h-11 text-start" value={proposalHook.valuation} onChange={e => proposalHook.setValuation(e.target.value)} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 4. Milestones */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl">{t('proposals.new.milestones_title')}</CardTitle>
                                        <CardDescription>{t('proposals.new.milestones_desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {proposalHook.milestones.map((m, i) => (
                                            <div key={i} className="flex flex-col md:flex-row gap-4 mb-4 items-end bg-muted/20 p-4 rounded-xl">
                                                <div className="w-full md:flex-1 space-y-2">
                                                    <Label className="text-xs font-bold uppercase">{t('proposals.new.lbl_milestone_name')}</Label>
                                                    <Input className="text-start" value={m.name} onChange={e => proposalHook.handleMilestoneChange(i, 'name', e.target.value)} />
                                                </div>
                                                <div className="w-full md:w-24 space-y-2">
                                                    <Label className="text-xs font-bold uppercase">{t('proposals.new.lbl_days')}</Label>
                                                    <Input type="number" className="text-center" value={m.durationDays} onChange={e => proposalHook.handleMilestoneChange(i, 'durationDays', e.target.value)} />
                                                </div>
                                                <div className="w-full md:w-40 space-y-2">
                                                    <Label className="text-xs font-bold uppercase">{t('proposals.new.lbl_amount')}</Label>
                                                    <Input type="number" className="text-start" value={m.amount} onChange={e => proposalHook.handleMilestoneChange(i, 'amount', e.target.value)} />
                                                </div>
                                                {i > 0 && <Button variant="destructive" size="icon" onClick={() => proposalHook.handleRemoveMilestone(i)} className="shrink-0"><span className="text-lg">×</span></Button>}
                                            </div>
                                        ))}
                                        <Button variant="outline" size="lg" onClick={proposalHook.handleAddMilestone} className="mt-2 w-full border-dashed border-2 hover:border-primary hover:text-primary">
                                            + {t('proposals.new.btn_add_milestone')}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg h-14 font-bold shadow-lg shadow-emerald-600/20" onClick={proposalHook.handleSubmit} disabled={proposalHook.isPending}>
                                    {proposalHook.isPending ? <DaoLoadingSpinner /> : t('proposals.new.btn_submit_startup')}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= TREASURY WIZARD ================= */}
                    <TabsContent value="treasury">
                        <Card className="max-w-3xl mx-auto border-purple-500/20 shadow-xl">
                            <CardHeader className="bg-purple-500/5 pb-6 border-b border-purple-500/10">
                                <CardTitle className="text-purple-700 flex gap-3 text-2xl"><Vote className="w-8 h-8"/> {t('proposals.new.treasury_title')}</CardTitle>
                                <CardDescription className="text-base mt-2">{t('proposals.new.treasury_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-8 px-8">
                                <div className="space-y-2">
                                    <Label className="text-base">{t('proposals.new.lbl_proposal_title')}</Label>
                                    <Input className="h-12 text-start" value={tTitle} onChange={e => setTTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-base">{t('proposals.new.lbl_desc_reason')}</Label>
                                    <Textarea className="min-h-[140px] text-start resize-y" value={tDesc} onChange={e => setTDesc(e.target.value)} />
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-base">{t('treasury_page.deposit_amount')}</Label>
                                        <Input type="number" placeholder="0.00" value={tAmount} onChange={e => setTAmount(e.target.value)} className="font-mono text-lg h-12 text-start" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">{t('proposals.new.lbl_token_type')}</Label>
                                        <Select value={tToken} onValueChange={setTToken}>
                                            <SelectTrigger className="h-12 text-start"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1" className="text-start">{t('proposals.new.opt_governance')}</SelectItem>
                                                <SelectItem value="0" className="text-start">{t('proposals.new.opt_native')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-base">
                                        <Wallet className="w-4 h-4 text-muted-foreground" />
                                        {t('proposals.new.lbl_recipient')}
                                    </Label>
                                    <Input placeholder={t('proposals.new.ph_wallet')} value={tRecipient} onChange={e => setTRecipient(e.target.value)} className="font-mono text-sm h-12 text-start" dir="ltr" />
                                    <p className="text-xs text-muted-foreground">{t('proposals.new.note_self_recipient')}</p>
                                </div>

                                <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-lg h-14" onClick={handleTreasurySubmit} disabled={isSubmittingTreasury || isConfirming}>
                                    {isSubmittingTreasury ? <DaoLoadingSpinner /> : t('proposals.new.btn_submit_treasury')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}