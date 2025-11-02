// src/app/proposals/new/page.tsx - FINAL CORRECTED VERSION

"use client";

import { useEffect } from 'react';
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
import { useCreateProposal } from '@/hooks/useCreateProposal';
import { toast } from 'sonner';

// ✅ NEW IMPORTS: برای فیلدهای جدید فرم
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function NewProposalPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { userRole, address, registryAddress, isHydrated } = useWeb3();
    const { isConnected } = useAccount(); 

    // ✅ FIX: دسترسی به صفحه اکنون فقط برای نقش‌های مجاز است
    const canAccessPage = userRole === 'startup' || userRole === 'admin';
    const canSubmitProposal = canAccessPage && isConnected; 

    // ✅✅✅ THE FIX IS HERE: دریافت تمام متغیرهای جدید از هوک ✅✅✅
    const {
        description, setDescription,
        recipient, setRecipient,
        milestoneAmounts,
        handleAddMilestone,
        handleMilestoneAmountChange,
        handleRemoveMilestone,
        // متغیرهای جدید AI
        startupIndustry, setStartupIndustry,
        teamExperienceYears, setTeamExperienceYears,
        hasPreviousFunding, setHasPreviousFunding,
        marketSize, setMarketSize,
        teamBio, setTeamBio,
        // توابع و وضعیت‌ها
        handleSubmit,
        isPending,
        isButtonDisabled,
        isFormValid
    } = useCreateProposal({ daoAddress: registryAddress, isFormEnabled: canSubmitProposal }); // فرض می‌کنیم registryAddress همان daoAddress است یا از آن خوانده می‌شود

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
    
    const onFormSubmit = (e: React.FormEvent) => handleSubmit(e, address); 

    return (
        <AppLayout>
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
                        {!isConnected && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('dashboard.connect_to_see_data_title')}</AlertTitle>
                                <AlertDescription>{t('new_proposal_page.connect_to_submit')}</AlertDescription>
                            </Alert>
                        )}
                       
                       {/* --- AI Feature Inputs (بخش کامل شده) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="startup-industry">{t('new_proposal_page.startup_industry_label')}</Label>
                                <Select onValueChange={setStartupIndustry} value={startupIndustry} disabled={isPending}>
                                    <SelectTrigger><SelectValue placeholder={t('new_proposal_page.startup_industry_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fintech">Fintech</SelectItem>
                                        <SelectItem value="AI">Artificial Intelligence</SelectItem>
                                        <SelectItem value="HealthTech">HealthTech</SelectItem>
                                        <SelectItem value="DeFi">DeFi / Web3</SelectItem>
                                        <SelectItem value="SaaS">SaaS</SelectItem>
                                        <SelectItem value="Gaming">Gaming</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="team-experience-years">{t('new_proposal_page.team_experience_years_label')}</Label>
                                <Input id="team-experience-years" type="number" placeholder="e.g., 25" value={teamExperienceYears} onChange={(e) => setTeamExperienceYears(e.target.value)} disabled={isPending} />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('new_proposal_page.has_previous_funding_label')}</Label>
                                <RadioGroup onValueChange={setHasPreviousFunding} value={hasPreviousFunding} className="flex gap-4 pt-2" disabled={isPending}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="true" id="funding-yes" /><Label htmlFor="funding-yes">{t('common.yes')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="false" id="funding-no" /><Label htmlFor="funding-no">{t('common.no')}</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="market-size">{t('new_proposal_page.market_size_label')}</Label>
                                <Input id="market-size" type="number" placeholder="e.g., 5000000000" value={marketSize} onChange={(e) => setMarketSize(e.target.value)} disabled={isPending} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="team-bio">{t('new_proposal_page.team_bio_label')}</Label>
                            <Textarea id="team-bio" placeholder={t('new_proposal_page.team_bio_placeholder')} className="min-h-[100px]" value={teamBio} onChange={(e) => setTeamBio(e.target.value)} disabled={isPending} />
                        </div>
                        {/* --- END AI Feature Inputs --- */}

                        <div className="space-y-2">
                            <Label htmlFor="proposal-description">{t('new_proposal_page.full_description')}</Label>
                            <Textarea id="proposal-description" placeholder={t('new_proposal_page.full_description_placeholder')} className="min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
                            <p className="text-sm text-muted-foreground">{t('new_proposal_page.off_chain_note')}</p>
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
                                        <Input type="number" inputMode="decimal" step="any" min="0" placeholder="1000" value={amount} onChange={(e) => handleMilestoneAmountChange(index, e.target.value)} disabled={isPending} />
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