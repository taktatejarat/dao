// src/app/guide/page.tsx - INTERACTIVE LEARNING CENTER

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, Vote, TrendingUp, Upload, ShieldCheck, Coins, UserCheck, PlayCircle, BookOpen } from "lucide-react";
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/LanguageProvider';
import { motion } from "framer-motion";

export default function GuidePage() {
    const { t } = useTranslation();
    const { direction } = useLanguage(); 

    return (
        <AppLayout>
            <div className="container py-16 max-w-6xl mx-auto">
                <header className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                        <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-gradient mb-4">
                        {t('guide_page.title')}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t('guide_page.subtitle')}
                    </p>
                </header>

                <Tabs defaultValue="investor" className="w-full" dir={direction}>
                    <div className="flex justify-center mb-12">
                        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto p-1.5 bg-muted/50 rounded-full border border-border/50">
                            <TabsTrigger value="investor" className="py-3 px-6 rounded-full text-base font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                                {t('guide_page.tabs.investor')}
                            </TabsTrigger>
                            <TabsTrigger value="startup" className="py-3 px-6 rounded-full text-base font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                                {t('guide_page.tabs.startup')}
                            </TabsTrigger>
                            <TabsTrigger value="voter" className="py-3 px-6 rounded-full text-base font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                                {t('guide_page.tabs.voter')}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="investor" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <StepGrid>
                            <GuideCard step={1} icon={Wallet} title={t('guide_page.investor.step1_title')} desc={t('guide_page.investor.step1_desc')} />
                            <GuideCard step={2} icon={TrendingUp} title={t('guide_page.investor.step2_title')} desc={t('guide_page.investor.step2_desc')} />
                            <GuideCard step={3} icon={Coins} title={t('guide_page.investor.step3_title')} desc={t('guide_page.investor.step3_desc')} action={{ href: "/staking", label: t('guide_page.actions.go_to_staking') }} />
                        </StepGrid>
                    </TabsContent>

                    <TabsContent value="startup" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <StepGrid>
                            <GuideCard step={1} icon={UserCheck} title={t('guide_page.startup.step1_title')} desc={t('guide_page.startup.step1_desc')} action={{ href: "/proposals/new", label: t('guide_page.actions.create_proposal') }} />
                            <GuideCard step={2} icon={ShieldCheck} title={t('guide_page.startup.step2_title')} desc={t('guide_page.startup.step2_desc')} />
                            <GuideCard step={3} icon={Vote} title={t('guide_page.startup.step3_title')} desc={t('guide_page.startup.step3_desc')} />
                        </StepGrid>
                    </TabsContent>

                     <TabsContent value="voter" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <StepGrid>
                            <GuideCard step={1} icon={Wallet} title={t('guide_page.voter.step1_title')} desc={t('guide_page.voter.step1_desc')} />
                            <GuideCard step={2} icon={Vote} title={t('guide_page.voter.step2_title')} desc={t('guide_page.voter.step2_desc')} action={{ href: "/proposals", label: t('guide_page.actions.view_proposals') }} />
                        </StepGrid>
                    </TabsContent>
                </Tabs>

                {/* FAQ / Video Section (Optional Placeholder) */}
                <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/50 border border-primary/10 text-center">
                    <PlayCircle className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
                    <h2 className="text-2xl font-bold mb-2">{t('guide_page.video_tutorial_title')}</h2>
                    <p className="text-muted-foreground mb-6">{t('guide_page.video_tutorial_desc')}</p>
                    <Button variant="outline" className="gap-2">
                        {t('guide_page.watch_video')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}

function StepGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">{children}</div>;
}

function GuideCard({ step, icon: Icon, title, desc, action }: any) {
    return (
        <Card className="relative overflow-hidden group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            
            <CardHeader className="relative z-10 pb-2">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-background rounded-xl border shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-4xl font-black text-muted/20 select-none">0{step}</span>
                </div>
                <CardTitle className="text-xl font-bold leading-tight">{title}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed min-h-[60px]">{desc}</p>
                {action && (
                    <Button asChild variant="ghost" className="w-full justify-between group-hover:text-primary group-hover:bg-primary/5">
                        <Link href={action.href}>
                            {action.label} 
                            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}