// src/app/guide/page.tsx - I18N Ready

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, Vote, TrendingUp, Upload, ShieldCheck, Coins } from "lucide-react";
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation'; // ✅ ایمپورت هوک ترجمه

export default function GuidePage() {
    const { t } = useTranslation(); // ✅ استفاده از هوک

    return (
        <AppLayout>
            <div className="container py-10 max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold font-headline text-gradient mb-4">{t('guide_page.title')}</h1>
                    <p className="text-muted-foreground text-lg">{t('guide_page.subtitle')}</p>
                </div>

                <Tabs defaultValue="investor" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1 bg-muted/50">
                        <TabsTrigger value="investor" className="py-3 text-lg">{t('guide_page.tabs.investor')}</TabsTrigger>
                        <TabsTrigger value="startup" className="py-3 text-lg">{t('guide_page.tabs.startup')}</TabsTrigger>
                        <TabsTrigger value="voter" className="py-3 text-lg">{t('guide_page.tabs.voter')}</TabsTrigger>
                    </TabsList>

                    {/* --- Investor Guide --- */}
                    <TabsContent value="investor" className="space-y-6">
                        <GuideStep 
                            step={1} 
                            icon={Wallet} 
                            title={t('guide_page.investor.step1_title')} 
                            desc={t('guide_page.investor.step1_desc')}
                        />
                        <GuideStep 
                            step={2} 
                            icon={TrendingUp} 
                            title={t('guide_page.investor.step2_title')} 
                            desc={t('guide_page.investor.step2_desc')}
                        />
                        <GuideStep 
                            step={3} 
                            icon={Coins} 
                            title={t('guide_page.investor.step3_title')} 
                            desc={t('guide_page.investor.step3_desc')}
                            actionLink="/staking"
                            actionText={t('guide_page.actions.go_to_staking')}
                        />
                    </TabsContent>

                    {/* --- Startup Guide --- */}
                    <TabsContent value="startup" className="space-y-6">
                        <GuideStep 
                            step={1} 
                            icon={Upload} 
                            title={t('guide_page.startup.step1_title')} 
                            desc={t('guide_page.startup.step1_desc')}
                            actionLink="/proposals/new"
                            actionText={t('guide_page.actions.create_proposal')}
                        />
                        <GuideStep 
                            step={2} 
                            icon={ShieldCheck} 
                            title={t('guide_page.startup.step2_title')} 
                            desc={t('guide_page.startup.step2_desc')}
                        />
                        <GuideStep 
                            step={3} 
                            icon={Vote} 
                            title={t('guide_page.startup.step3_title')} 
                            desc={t('guide_page.startup.step3_desc')}
                        />
                    </TabsContent>

                     {/* --- Voter Guide --- */}
                     <TabsContent value="voter" className="space-y-6">
                        <GuideStep 
                            step={1} 
                            icon={Wallet} 
                            title={t('guide_page.voter.step1_title')} 
                            desc={t('guide_page.voter.step1_desc')}
                        />
                        <GuideStep 
                            step={2} 
                            icon={Vote} 
                            title={t('guide_page.voter.step2_title')} 
                            desc={t('guide_page.voter.step2_desc')}
                            actionLink="/proposals"
                            actionText={t('guide_page.actions.view_proposals')}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

// کامپوننت کمکی (نیاز به ترجمه ندارد چون props می‌گیرد)
function GuideStep({ step, icon: Icon, title, desc, actionLink, actionText }: any) {
    const { direction } = useTranslation(); // برای جهت آیکون فلش
    
    return (
        <Card className="card-glow border-l-4 border-l-primary">
            <CardContent className="flex gap-6 p-6 items-start">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl">
                    {step}
                </div>
                <div className="space-y-2 flex-grow">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        {title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{desc}</p>
                    {actionLink && (
                        <div className="pt-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={actionLink}>
                                    {actionText} 
                                    <ArrowRight className={`mx-2 w-4 h-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}