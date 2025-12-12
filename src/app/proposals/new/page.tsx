// src/app/proposals/new/page.tsx - WITH VALIDATION MESSAGES

"use client";

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useWeb3 } from '@/context/Web3Provider';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useCreateProposal } from '@/hooks/useCreateProposal';
import { useTranslation } from '@/hooks/use-translation';
import { 
    Rocket, Vote, UploadCloud, BadgeCheck, Building2, Wallet, 
    LinkIcon, Users, FileCheck, CheckCircle2, ArrowRight, ArrowLeft, FileText, AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewProposalPage() {
    const { t, locale } = useTranslation();
    const dir = locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr';
    const isRtl = dir === 'rtl';
    const { userRole, address, daoAddress } = useWeb3();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("startup");
    const wizard = useCreateProposal({ daoAddress, router });

    // --- Treasury Logic ---
    const [tTitle, setTTitle] = useState('');
    const [tDesc, setTDesc] = useState('');
    const [tAmount, setTAmount] = useState('');
    const [tRecipient, setTRecipient] = useState('');
    const [tToken, setTToken] = useState('1'); 
    const { writeContractAsync, data: txHash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
    const [isSubmittingTreasury, setIsSubmittingTreasury] = useState(false);

    const handleTreasurySubmit = async () => {
        if (!address) return toast.error(t('wallet.not_connected'));
        if (!tTitle || !tDesc || !tAmount) return toast.warning(t('toasts.fill_all_fields'));
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

    // --- Helpers ---
    const FileUploadBox = ({ label, file, setFile, required = false, accept = ".pdf" }: any) => (
        <div className={cn(
            "border border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors gap-3 text-center group relative overflow-hidden",
            required && !file ? "border-amber-500/50 bg-amber-500/5" : "border-primary/30"
        )}>
            <input 
                type="file" 
                accept={accept}
                className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
            <div className={cn("p-3 rounded-full transition-colors", file ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary group-hover:bg-primary/20")}>
                {file ? <FileCheck className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
                <p className="font-medium text-sm">
                    {label} {required && <span className="text-red-500">*</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                    {file ? file.name : t('proposals.new.drag_drop_click')}
                </p>
            </div>
            {file && <span className="absolute top-2 right-2 text-green-600 bg-white/80 rounded-full p-0.5"><CheckCircle2 className="w-4 h-4"/></span>}
        </div>
    );

    // Wrapper for Input with Error Message
    const FormItem = ({ label, required, error, children }: any) => (
        <div className="space-y-2">
            <Label className="flex items-center gap-1">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
            {error && (
                <div className="flex items-center gap-1 text-red-500 text-xs animate-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );

    return (
        <AppLayout>
            <div className="container max-w-5xl py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4" dir={dir}>
                
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold font-headline text-gradient">{t('proposals.new.title')}</h1>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Mode Selection */}
                    <div className="flex justify-center mb-8">
                        <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-muted rounded-full">
                            <TabsTrigger value="startup" className="rounded-full text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <Rocket className="w-4 h-4 mr-2 rtl:ml-2" /> {t('proposals.new.tab_startup')}
                            </TabsTrigger>
                            <TabsTrigger value="treasury" disabled={userRole !== 'admin'} className="rounded-full text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <Vote className="w-4 h-4 mr-2 rtl:ml-2" /> {t('proposals.new.tab_treasury')}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ================= STARTUP WIZARD ================= */}
                    <TabsContent value="startup" className="focus-visible:outline-none">
                        
                        {/* Stepper Header */}
                        <div className="mb-8 hidden md:flex items-center justify-between px-4">
                            {[1, 2, 3, 4, 5].map((step) => {
                                const isActive = step === wizard.currentStep;
                                const isDone = step < wizard.currentStep;
                                return (
                                    <div key={step} className="flex items-center flex-1 last:flex-none">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all",
                                            isActive ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg" : 
                                            isDone ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground"
                                        )}>
                                            {isDone ? <CheckCircle2 className="w-6 h-6" /> : step}
                                        </div>
                                        {step !== 5 && (
                                            <div className={cn("h-1 flex-1 mx-4 rounded-full transition-colors", isDone ? "bg-primary" : "bg-muted")} />
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Wizard Steps */}
                        <Card className="border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6 md:p-8 min-h-[400px]">
                                
                                {/* STEP 1: Basic Info */}
                                {wizard.currentStep === 1 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b">
                                            <Building2 className="w-6 h-6 text-primary" />
                                            <h2 className="text-xl font-bold">{t('proposals.new.step1_title')}</h2>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormItem label={t('proposals.new.lbl_name')} required error={wizard.errors.projectName}>
                                                <Input 
                                                    placeholder={t('proposals.new.ph_name')} 
                                                    value={wizard.projectName} 
                                                    onChange={e => wizard.setProjectName(e.target.value)} 
                                                    className={wizard.errors.projectName ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                    autoFocus 
                                                />
                                            </FormItem>
                                            <FormItem label={t('proposals.new.lbl_tagline')} required error={wizard.errors.tagline}>
                                                <Input 
                                                    placeholder={t('proposals.new.ph_tagline')} 
                                                    value={wizard.tagline} 
                                                    onChange={e => wizard.setTagline(e.target.value)}
                                                    className={wizard.errors.tagline ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                />
                                            </FormItem>
                                        </div>

                                        <FormItem label={t('proposals.new.lbl_problem_solution')} required error={wizard.errors.description}>
                                            <Textarea 
                                                className={cn("min-h-[120px]", wizard.errors.description ? "border-red-500 focus-visible:ring-red-500" : "")} 
                                                placeholder={t('proposals.new.ph_problem_solution')} 
                                                value={wizard.description} 
                                                onChange={e => wizard.setDescription(e.target.value)} 
                                            />
                                        </FormItem>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.stage_title')}</Label>
                                                <Select value={wizard.startupStage} onValueChange={(v:any) => wizard.setStartupStage(v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="idea">{t('proposals.new.stage_idea')}</SelectItem>
                                                        <SelectItem value="revenue">{t('proposals.new.stage_revenue')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('proposals.new.kb_title')}</Label>
                                                <Select value={wizard.knowledgeBasedType} onValueChange={wizard.setKnowledgeBasedType}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">{t('proposals.new.kb_none')}</SelectItem>
                                                        <SelectItem value="type1">{t('proposals.new.kb_type1')}</SelectItem>
                                                        <SelectItem value="type2">{t('proposals.new.kb_type2')}</SelectItem>
                                                        <SelectItem value="creative">{t('proposals.new.kb_creative')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Team & Company */}
                                {wizard.currentStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b">
                                            <Users className="w-6 h-6 text-primary" />
                                            <h2 className="text-xl font-bold">{t('proposals.new.step2_title')}</h2>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-6">
                                            <FormItem label={t('proposals.new.lbl_founded_date')} required error={wizard.errors.foundedDate}>
                                                <Input 
                                                    type="date" 
                                                    value={wizard.foundedDate} 
                                                    onChange={e => wizard.setFoundedDate(e.target.value)} 
                                                    className={wizard.errors.foundedDate ? "border-red-500" : ""}
                                                />
                                            </FormItem>
                                            <FormItem label={t('proposals.new.lbl_team_size')} required error={wizard.errors.teamSize}>
                                                <Input 
                                                    type="number" 
                                                    value={wizard.teamSize} 
                                                    onChange={e => wizard.setTeamSize(e.target.value)} 
                                                    className={wizard.errors.teamSize ? "border-red-500" : ""}
                                                />
                                            </FormItem>
                                            <FormItem label={t('proposals.new.lbl_company_reg_id')}>
                                                <Input value={wizard.companyRegId} onChange={e => wizard.setCompanyRegId(e.target.value)} />
                                            </FormItem>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormItem label={t('proposals.new.lbl_linkedin')} required error={wizard.errors.linkedinProfile}>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 rtl:right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        className={cn("pl-9 rtl:pr-9 rtl:pl-3", wizard.errors.linkedinProfile ? "border-red-500" : "")} 
                                                        placeholder="https://linkedin.com/in/..." 
                                                        dir="ltr" 
                                                        value={wizard.linkedinProfile} 
                                                        onChange={e => wizard.setLinkedinProfile(e.target.value)} 
                                                    />
                                                </div>
                                            </FormItem>
                                            <FormItem label={t('proposals.new.lbl_demo_url')} error={wizard.errors.demoUrl}>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 rtl:right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        className={cn("pl-9 rtl:pr-9 rtl:pl-3", wizard.errors.demoUrl ? "border-red-500" : "")}
                                                        placeholder="https://" 
                                                        dir="ltr" 
                                                        value={wizard.demoUrl} 
                                                        onChange={e => wizard.setDemoUrl(e.target.value)} 
                                                    />
                                                </div>
                                            </FormItem>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Market & Strategy */}
                                {wizard.currentStep === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b">
                                            <Rocket className="w-6 h-6 text-primary" />
                                            <h2 className="text-xl font-bold">{t('proposals.new.step3_title')}</h2>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-6">
                                            <FormItem label={t('proposals.new.lbl_tam')} required error={wizard.errors.tam}>
                                                <Input type="number" placeholder="$" value={wizard.tam} onChange={e => wizard.setTam(e.target.value)} className={wizard.errors.tam ? "border-red-500" : ""}/>
                                            </FormItem>
                                            <FormItem label={t('proposals.new.lbl_sam')} required error={wizard.errors.sam}>
                                                <Input type="number" placeholder="$" value={wizard.sam} onChange={e => wizard.setSam(e.target.value)} className={wizard.errors.sam ? "border-red-500" : ""}/>
                                            </FormItem>
                                            <FormItem label={t('proposals.new.lbl_som')} required error={wizard.errors.som}>
                                                <Input type="number" placeholder="$" value={wizard.som} onChange={e => wizard.setSom(e.target.value)} className={wizard.errors.som ? "border-red-500" : ""}/>
                                            </FormItem>
                                        </div>

                                        <FormItem label={t('proposals.new.lbl_competitors')} required error={wizard.errors.competitors}>
                                            <Textarea 
                                                placeholder={t('proposals.new.ph_competitors')} 
                                                value={wizard.competitors} 
                                                onChange={e => wizard.setCompetitors(e.target.value)} 
                                                className={wizard.errors.competitors ? "border-red-500" : ""}
                                            />
                                        </FormItem>
                                        
                                        <FormItem label={t('proposals.new.lbl_business_model')} required error={wizard.errors.businessModel}>
                                            <Textarea 
                                                placeholder={t('proposals.new.ph_business_model')} 
                                                value={wizard.businessModel} 
                                                onChange={e => wizard.setBusinessModel(e.target.value)} 
                                                className={wizard.errors.businessModel ? "border-red-500" : ""}
                                            />
                                        </FormItem>
                                    </div>
                                )}

                                {/* STEP 4: Financials & Milestones */}
                                {wizard.currentStep === 4 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b">
                                            <Wallet className="w-6 h-6 text-primary" />
                                            <h2 className="text-xl font-bold">{t('proposals.new.step4_title')}</h2>
                                        </div>

                                        {/* Dynamic Financial Fields */}
                                        <div className="grid md:grid-cols-3 gap-6 bg-muted/30 p-4 rounded-xl">
                                            {wizard.startupStage === 'idea' ? (
                                                <>
                                                    <FormItem label={t('proposals.new.lbl_burn_rate')} required error={wizard.errors.burnRate}>
                                                        <Input type="number" value={wizard.burnRate} onChange={e => wizard.setBurnRate(e.target.value)} className={wizard.errors.burnRate ? "border-red-500" : ""}/>
                                                    </FormItem>
                                                    <FormItem label={`${t('proposals.new.lbl_runway')} (Months)`} required error={wizard.errors.runway}>
                                                        <Input type="number" value={wizard.runway} onChange={e => wizard.setRunway(e.target.value)} className={wizard.errors.runway ? "border-red-500" : ""}/>
                                                    </FormItem>
                                                </>
                                            ) : (
                                                <>
                                                    <FormItem label={t('proposals.new.lbl_revenue')} required error={wizard.errors.revenueProj}>
                                                        <Input type="number" value={wizard.revenueProj} onChange={e => wizard.setRevenueProj(e.target.value)} className={wizard.errors.revenueProj ? "border-red-500" : ""}/>
                                                    </FormItem>
                                                    <FormItem label={t('proposals.new.lbl_net_profit')} required error={wizard.errors.netProfit}>
                                                        <Input type="number" value={wizard.netProfit} onChange={e => wizard.setNetProfit(e.target.value)} className={wizard.errors.netProfit ? "border-red-500" : ""}/>
                                                    </FormItem>
                                                    <FormItem label={`${t('proposals.new.lbl_ebitda')} %`}>
                                                        <Input type="number" value={wizard.ebitda} onChange={e => wizard.setEbitda(e.target.value)} />
                                                    </FormItem>
                                                </>
                                            )}
                                            <FormItem label={t('proposals.new.lbl_valuation')} required error={wizard.errors.valuation}>
                                                <Input type="number" value={wizard.valuation} onChange={e => wizard.setValuation(e.target.value)} className={wizard.errors.valuation ? "border-red-500" : ""}/>
                                            </FormItem>
                                        </div>

                                        {/* Milestones */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-lg">{t('proposals.new.milestones_title')}</Label>
                                                <Button variant="ghost" size="sm" onClick={wizard.handleAddMilestone} className="text-primary hover:bg-primary/10">
                                                    + {t('proposals.new.btn_add_milestone')}
                                                </Button>
                                            </div>
                                            {wizard.milestones.map((m, i) => (
                                                <div key={i} className="flex flex-col md:flex-row gap-3 items-end bg-card border p-3 rounded-lg">
                                                    <div className="flex-1 w-full space-y-1">
                                                        <Label className="text-xs">{t('proposals.new.lbl_milestone_name')}</Label>
                                                        <Input value={m.name} onChange={e => wizard.handleMilestoneChange(i, 'name', e.target.value)} />
                                                    </div>
                                                    <div className="w-24 space-y-1">
                                                        <Label className="text-xs">{t('proposals.new.lbl_days')}</Label>
                                                        <Input type="number" className="text-center" value={m.durationDays} onChange={e => wizard.handleMilestoneChange(i, 'durationDays', e.target.value)} />
                                                    </div>
                                                    <div className="w-32 space-y-1">
                                                        <Label className="text-xs">{t('proposals.new.lbl_amount')}</Label>
                                                        <Input type="number" value={m.amount} onChange={e => wizard.handleMilestoneChange(i, 'amount', e.target.value)} />
                                                    </div>
                                                    {i > 0 && <Button variant="destructive" size="icon" onClick={() => wizard.handleRemoveMilestone(i)} type="button"><span className="text-lg">×</span></Button>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 5: Documents & Submit */}
                                {wizard.currentStep === 5 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b">
                                            <FileText className="w-6 h-6 text-primary" />
                                            <h2 className="text-xl font-bold">{t('proposals.new.step5_title')}</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FileUploadBox 
                                                label={t('proposals.new.upload_pitch')} 
                                                file={wizard.pitchDeckFile} 
                                                setFile={wizard.setPitchDeckFile} 
                                                required={true}
                                            />
                                            <FileUploadBox 
                                                label={t('proposals.new.upload_financials')} 
                                                file={wizard.financialsFile} 
                                                setFile={wizard.setFinancialsFile} 
                                                accept=".pdf,.xls,.xlsx"
                                            />
                                            <FileUploadBox 
                                                label={t('proposals.new.upload_legal')} 
                                                file={wizard.legalFile} 
                                                setFile={wizard.setLegalFile} 
                                            />
                                            <FileUploadBox 
                                                label={t('proposals.new.upload_whitepaper')} 
                                                file={wizard.whitepaperFile} 
                                                setFile={wizard.setWhitepaperFile} 
                                            />
                                        </div>

                                        <div className="space-y-2 mt-6 p-4 bg-muted/20 rounded-lg">
                                            <FormItem label={t('proposals.new.lbl_recipient')} error={wizard.errors.recipient}>
                                                <div className="relative">
                                                    <Wallet className="absolute left-3 rtl:right-3 top-3.5 w-4 h-4 text-muted-foreground" />
                                                    <Input 
                                                        placeholder={t('proposals.new.ph_wallet')} 
                                                        value={wizard.recipient} 
                                                        onChange={e => wizard.setRecipient(e.target.value)} 
                                                        className={cn("pl-9 rtl:pr-9 rtl:pl-3 font-mono text-sm", wizard.errors.recipient ? "border-red-500" : "")} 
                                                        dir="ltr" 
                                                    />
                                                </div>
                                            </FormItem>
                                            <p className="text-xs text-muted-foreground">{t('proposals.new.note_self_recipient')}</p>
                                        </div>
                                    </div>
                                )}

                            </CardContent>

                            <CardFooter className="flex justify-between p-6 border-t bg-muted/10">
                                <Button 
                                    variant="outline" 
                                    onClick={wizard.handlePrevStep} 
                                    disabled={wizard.currentStep === 1 || wizard.isPending}
                                    type="button"
                                >
                                    {isRtl ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                                    {t('common.back')}
                                </Button>

                                {wizard.currentStep < 5 ? (
                                    <Button onClick={wizard.handleNextStep} type="button">
                                        {t('common.next')}
                                        {isRtl ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={wizard.handleSubmit} 
                                        disabled={wizard.isPending} 
                                        className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]"
                                        type="button"
                                    >
                                        {wizard.isPending ? <DaoLoadingSpinner /> : t('proposals.new.btn_submit_startup')}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* ================= TREASURY TAB ================= */}
                    <TabsContent value="treasury" className="focus-visible:outline-none">
                        <Card className="max-w-3xl mx-auto border-purple-500/20 shadow-xl">
                            {/* Treasury Content Remains Same */}
                            <CardHeader className="bg-purple-500/5 pb-6 border-b border-purple-500/10">
                                <CardTitle className="text-purple-700 flex gap-3 text-2xl"><Vote className="w-8 h-8"/> {t('proposals.new.treasury_title')}</CardTitle>
                                <CardDescription className="text-base mt-2">{t('proposals.new.treasury_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-8 px-8">
                                <div className="space-y-2">
                                    <Label className="text-base">{t('proposals.new.lbl_proposal_title')}</Label>
                                    <Input className="h-12" value={tTitle} onChange={e => setTTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-base">{t('proposals.new.lbl_desc_reason')}</Label>
                                    <Textarea className="min-h-[140px] resize-y" value={tDesc} onChange={e => setTDesc(e.target.value)} />
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-base">{t('treasury_page.deposit_amount')}</Label>
                                        <Input type="number" placeholder="0.00" value={tAmount} onChange={e => setTAmount(e.target.value)} className="font-mono text-lg h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">{t('proposals.new.lbl_token_type')}</Label>
                                        <Select value={tToken} onValueChange={setTToken}>
                                            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">{t('proposals.new.opt_governance')}</SelectItem>
                                                <SelectItem value="0">{t('proposals.new.opt_native')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-lg h-14" onClick={handleTreasurySubmit} disabled={isSubmittingTreasury || isConfirming} type="button">
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