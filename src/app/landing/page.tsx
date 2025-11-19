// src/app/landing/page.tsx - FINAL, DYNAMIC VERSION

"use client";

import { Button } from "@/components/ui/button";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowRight, Bot, ShieldCheck, TrendingUp, Zap, Link as LinkIcon, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/LanguageProvider";
import { useTheme } from "next-themes";
import { Logo } from "@/components/icons/logo";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

// ✅✅✅ STEP 1: ایمپورت هوک و کامپوننت‌های لازم ✅✅✅
import { useProposals, type ProposalListData } from "@/hooks/useProposals";
import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";
import { useMemo } from "react";

// --- کامپوننت جدید برای نمایش کارت‌های پروژه‌های منتخب ---
const FeaturedProposalsSection = () => {
    const { t } = useTranslation();
    const { proposals, isLoading, error } = useProposals();

    // ✅✅✅ THE CRITICAL FIX IS HERE: اصلاح منطق فیلتر و انتخاب ✅✅✅
    const featuredProposals = useMemo(() => {
        if (!proposals || proposals.length === 0) return [];
        
        // منطق انتخاب جدید:
        // ما دیگر به سختی بر اساس status فیلتر نمی‌کنیم.
        // در عوض، فقط پروپوزال‌ها را بر اساس جدیدترین (بر اساس شناسه MongoDB) مرتب می‌کنیم.
        // این تضمین می‌کند که همیشه ۳ پروپوزال آخر نمایش داده می‌شوند.
        return proposals
            .slice() // یک کپی از آرایه ایجاد می‌کنیم تا آرایه اصلی تغییر نکند
            .sort((a, b) => b._id.localeCompare(a._id)) // مرتب‌سازی نزولی بر اساس شناسه (جدیدترین اول)
            .slice(0, 3); // انتخاب ۳ مورد اول
    }, [proposals]);

    const getStatusInfo = (status: string | null | undefined): { key: string; variant: "secondary" | "default" | "success" | "destructive" } => {
        switch (status) {
            case 'voting': return { key: 'landing_page.status.voting', variant: 'default' };
            case 'approved':
            case 'executed': return { key: 'landing_page.status.funded', variant: 'success' };
            case 'rejected':
            case 'cancelled': return { key: 'landing_page.status.not_funded', variant: 'destructive' };
            default: return { key: 'landing_page.status.under_review', variant: 'secondary' };
        }
    };

    return (
        <section className="py-20">
            <div className="container">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline text-gradient">{t('landing_page.featured_proposals_title')}</h2>
                    <p className="text-muted-foreground mt-2 max-w-xl mx-auto">{t('landing_page.featured_proposals_subtitle')}</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center"><DaoLoadingSpinner /></div>
                ) : error ? (
                    <p className="text-center text-destructive">{error}</p>
                ) : featuredProposals.length === 0 ? (
                    <p className="text-center text-muted-foreground">{t('landing_page.no_featured_proposals')}</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredProposals.map((proposal) => {
                            const statusInfo = getStatusInfo(proposal.onChainStatus);
                            return (
                                <Card key={proposal._id} className="flex flex-col card-glow">
                                    <CardHeader>
                                        <CardTitle>{proposal.projectName}</CardTitle>
                                        <CardDescription className="flex-grow pt-2">{proposal.tagline}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="flex justify-between items-center mt-auto pt-4">
                                        <Badge variant={statusInfo.variant}>
                                            {t(statusInfo.key)}
                                        </Badge>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/proposals/${proposal._id}`}>
                                                {t('view_details')}
                                                <ArrowRight className="mx-2 rtl:rotate-180 size-4" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default function LandingPage() {
    const { t } = useTranslation();
    const { setTheme, theme } = useTheme();
    const { direction } = useLanguage();
    const { openConnectModal } = useConnectModal();

    return (
        <div dir={direction} className="bg-background text-foreground min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center">
                    <div className="flex items-center gap-2">
                        <Logo className="size-8 text-primary" />
                        <span className="text-xl font-bold font-headline text-gradient">RayanChain</span>
                    </div>
                    <div className="flex flex-1 items-center justify-end space-x-2">
                        <LanguageSwitcher/>
                        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">{t('header.toggle_theme')}</span>
                        </Button>
                       <ConnectButton />
                    </div>
                </div>
            </header>
            
            <main className="flex-1">
                {/* Hero Section */}
                <section className="container text-center py-20 sm:py-32">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter font-headline mb-4 text-gradient leading-tight">
                        {t('landing_page.hero_title')}
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                        {t('landing_page.hero_subtitle')}
                    </p>
                    <div className="flex justify-center gap-4">
                       <Button size="lg" onClick={openConnectModal}>
                           {t('landing_page.get_started')} <Zap className="mx-2" />
                       </Button>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 bg-muted/50">
                    <div className="container text-center">
                        <h2 className="text-3xl font-bold font-headline text-gradient mb-4">{t('landing_page.how_it_works_title')}</h2>
                        <p className="text-muted-foreground mb-12 max-w-xl mx-auto">{t('landing_page.how_it_works_subtitle')}</p>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                                   <LinkIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{t('landing_page.connect_participate_title')}</h3>
                                <p className="text-muted-foreground">{t('landing_page.connect_participate_desc')}</p>
                            </div>
                             <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                                   <Bot className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{t('landing_page.discover_analyze_title')}</h3>
                                <p className="text-muted-foreground">{t('landing_page.discover_analyze_desc')}</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                                    <TrendingUp className="w-8 h-8"/>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{t('landing_page.vote_invest_title')}</h3>
                                <p className="text-muted-foreground">{t('landing_page.vote_invest_desc')}</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                 {/* Featured Projects Section */}
                 {/* ✅✅✅ STEP 4: استفاده از کامپوننت جدید و داینامیک ✅✅✅ */}
                <FeaturedProposalsSection />
                </main>

            <footer className="py-6 border-t">
                <div className="container text-center text-muted-foreground">
                    {t('landing_page.footer_copy').replace('{year}', new Date().getFullYear().toString())}
                </div>
            </footer>
        </div>
    );
}
