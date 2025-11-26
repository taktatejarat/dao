// src/app/guide/page.tsx - FINAL RTL FIXED

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, Vote, TrendingUp, Upload, ShieldCheck, Coins, UserCheck, Globe, ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/LanguageProvider';
import { motion } from "framer-motion";

export default function GuidePage() {
    const { t } = useTranslation();
    const { direction } = useLanguage(); 

    return (
        <AppLayout>
            <div className="container py-12 max-w-5xl">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-gradient mb-6 leading-tight">
                        {t('guide_page.title')}
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                        {t('guide_page.subtitle')}
                    </p>
                </motion.div>

                {/* ✅ FIX: اضافه کردن dir={direction} به Tabs برای مدیریت صحیح جهت */}
                <Tabs defaultValue="investor" className="w-full" dir={direction}>
                    <TabsList className="grid w-full grid-cols-3 mb-12 h-auto p-2 bg-muted/30 backdrop-blur rounded-2xl border border-border/50">
                        <TabsTrigger value="investor" className="py-4 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">
                            <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5"/> {t('guide_page.tabs.investor')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="startup" className="py-4 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">
                            <span className="flex items-center gap-2"><Upload className="w-5 h-5"/> {t('guide_page.tabs.startup')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="voter" className="py-4 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">
                            <span className="flex items-center gap-2"><Vote className="w-5 h-5"/> {t('guide_page.tabs.voter')}</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* محتوای تب‌ها - جهت به صورت خودکار از والد ارث‌بری می‌شود */}
                    <TabsContent value="investor">
                        <StepContainer>
                            <GuideStep index={1} icon={Wallet} title={t('guide_page.investor.step1_title')} desc={t('guide_page.investor.step1_desc')} />
                            <GuideStep index={2} icon={Globe} title={t('guide_page.investor.step2_title')} desc={t('guide_page.investor.step2_desc')} />
                            <GuideStep index={3} icon={Coins} title={t('guide_page.investor.step3_title')} desc={t('guide_page.investor.step3_desc')} actionLink="/staking" actionText={t('guide_page.actions.go_to_staking')} />
                        </StepContainer>
                    </TabsContent>

                    <TabsContent value="startup">
                        <StepContainer>
                            <GuideStep index={1} icon={UserCheck} title={t('guide_page.startup.step1_title')} desc={t('guide_page.startup.step1_desc')} actionLink="/proposals/new" actionText={t('guide_page.actions.create_proposal')} />
                            <GuideStep index={2} icon={ShieldCheck} title={t('guide_page.startup.step2_title')} desc={t('guide_page.startup.step2_desc')} />
                            <GuideStep index={3} icon={Vote} title={t('guide_page.startup.step3_title')} desc={t('guide_page.startup.step3_desc')} />
                        </StepContainer>
                    </TabsContent>

                     <TabsContent value="voter">
                        <StepContainer>
                            <GuideStep index={1} icon={Wallet} title={t('guide_page.voter.step1_title')} desc={t('guide_page.voter.step1_desc')} />
                            <GuideStep index={2} icon={Vote} title={t('guide_page.voter.step2_title')} desc={t('guide_page.voter.step2_desc')} actionLink="/proposals" actionText={t('guide_page.actions.view_proposals')} />
                        </StepContainer>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

function StepContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid gap-8 relative">
            {/* خط اتصال دهنده عمودی */}
            <div className="absolute top-0 bottom-0 start-8 md:start-[50%] w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden md:block rtl:-translate-x-1/2" />
            {children}
        </div>
    );
}

function GuideStep({ index, icon: Icon, title, desc, actionLink, actionText }: any) {
    const { direction } = useLanguage();
    const isEven = index % 2 === 0;

    // منطق چینش زیگزاگی بر اساس جهت زبان
    // در RTL: اعداد فرد سمت راست، زوج سمت چپ
    const flexDirectionClass = isEven 
        ? (direction === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row-reverse') // برای زوج همیشه برعکس
        : ''; 

    // آیکون فلش مناسب
    const ActionIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`flex flex-col md:flex-row items-center gap-8 ${flexDirectionClass}`}
        >
            {/* دایره شماره */}
            <div className="relative z-10 flex-shrink-0">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 text-2xl font-bold">
                    {index}
                </div>
            </div>

            {/* کارت محتوا */}
            <Card className="flex-grow w-full md:w-[calc(50%-3rem)] card-glow hover:border-primary/50 transition-colors text-start">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-muted rounded-lg">
                            <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">{title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-base">
                        {desc}
                    </p>
                    {actionLink && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <Button asChild variant="ghost" className="group px-0 hover:bg-transparent hover:text-primary">
                                <Link href={actionLink} className="flex items-center gap-2">
                                    {actionText} 
                                    <ActionIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* فضای خالی برای تراز شدن زیگزاگی */}
            <div className="hidden md:block w-[calc(50%-3rem)]" />
        </motion.div>
    );
}