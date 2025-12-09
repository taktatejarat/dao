// src/app/landing/page.tsx - FINAL (Custom Wallet Connect)

"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, ShieldCheck, TrendingUp, Zap, Link as LinkIcon, Sun, Moon, Globe, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/LanguageProvider";
import { useTheme } from "next-themes";
import { Logo } from "@/components/icons/logo";
import { Card, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useProposals } from "@/hooks/useProposals";
import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";
import { useEffect, useMemo } from "react";
import { CustomConnectButton } from "@/components/wallet/custom-connect-button";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { ConnectWalletModal } from "@/components/wallet/connect-wallet-modal";
import { useAccount } from "wagmi";
import { useRouter } from 'next/navigation';

// --- Helper for Type-Safe Translation ---
const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    const t = (key: string, params?: any) => (originalT as any)(key, params);
    return { t, locale };
};

// --- ✅ NEW: High Visibility Background ---
const ModernBackground = () => (
    <div className="fixed inset-0 -z-50 h-full w-full bg-background overflow-hidden">
        {/* 1. Dot Pattern (Visible in Dark Mode) */}
        <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.05] dark:opacity-[0.15]" />
        
        {/* 2. Primary Glow (Top Center) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40 mix-blend-screen animate-pulse" />
        
        {/* 3. Secondary Glow (Bottom Right) */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-30" />
        
        {/* 4. Accent Glow (Bottom Left) */}
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] opacity-30" />
    </div>
);

// --- Featured Proposals ---
const FeaturedProposalsSection = () => {
    const { t } = useSafeTranslation(); // ✅ Use safe hook
    const { proposals, isLoading, error } = useProposals();

    const featuredProposals = useMemo(() => {
        if (!proposals || proposals.length === 0) return [];
        return proposals.slice().sort((a, b) => b._id.localeCompare(a._id)).slice(0, 3);
    }, [proposals]);

    const getStatusInfo = (status: string | null | undefined) => {
        switch (status) {
            case 'voting': return { key: 'landing_page.status.voting', variant: 'default' as const };
            case 'approved': case 'executed': return { key: 'landing_page.status.funded', variant: 'success' as const };
            case 'rejected': case 'cancelled': return { key: 'landing_page.status.not_funded', variant: 'destructive' as const };
            default: return { key: 'landing_page.status.under_review', variant: 'secondary' as const };
        }
    };

    return (
        <section className="py-24 relative">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        {/* ✅ FIX: Translated Badge */}
                        <Badge variant="outline" className="mb-4 text-primary border-primary/20">
                            {t('landing_page.live_opportunities')}
                        </Badge>
                        <h2 className="text-3xl font-bold font-headline text-gradient">{t('landing_page.featured_proposals_title')}</h2>
                        <p className="text-muted-foreground mt-2 max-w-xl">{t('landing_page.featured_proposals_subtitle')}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center"><DaoLoadingSpinner /></div>
                ) : featuredProposals.length === 0 ? (
                    <p className="text-center text-muted-foreground bg-muted/20 p-8 rounded-xl border border-dashed">{t('landing_page.no_featured_proposals')}</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {featuredProposals.map((proposal) => {
                            const statusInfo = getStatusInfo(proposal.onChainStatus);
                            return (
                                <Card key={proposal._id} className="flex flex-col card-glow border-primary/10 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1">{proposal.projectName}</CardTitle>
                                        <CardDescription className="flex-grow pt-2 line-clamp-2">{proposal.tagline}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="flex justify-between items-center mt-auto pt-4 border-t border-border/50">
                                        <Badge variant={statusInfo.variant}>
                                            {t(statusInfo.key)}
                                        </Badge>
                                        <Button asChild variant="outline" size="sm" className="bg-transparent hover:bg-primary/10 hover:text-primary">
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
    const { t } = useSafeTranslation(); // ✅ Use safe hook
    const { setTheme, theme } = useTheme();
    const { direction } = useLanguage();
    const { 
        isModalOpen, openModal, closeModal, 
        connectors, connect, isPending, connectError 
    } = useWalletConnect();
    const { isConnected } = useAccount();
    const router = useRouter();

    // ✅ منطق ریدایرکت خودکار
    useEffect(() => {
        if (isConnected) {
            router.push('/dashboard');
        }
    }, [isConnected, router]);

    return (
        <div dir={direction} className="bg-transparent text-foreground min-h-screen flex flex-col relative selection:bg-primary/30">
            {/* ✅ Background added here */}
            <ModernBackground />
            
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
                <div className="container flex h-16 items-center">
                    <div className="flex items-center gap-2">
                        <Logo className="size-8 text-primary" />
                        <span className="text-xl font-bold font-headline text-gradient hidden sm:inline-block">RayanChain</span>
                    </div>
                    <div className="flex flex-1 items-center justify-end space-x-2">
                        <LanguageSwitcher/>
                        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">{t('header.toggle_theme')}</span>
                        </Button>
                       <CustomConnectButton />
                    </div>
                </div>
            </header>
            
            <main className="flex-1">
                {/* Hero Section */}
                <section className="container text-center py-20 sm:py-32 relative z-10">
                    {/* ✅ FIX: Translated Badge */}
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                        <Rocket className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> 
                        {t('landing_page.live_badge')}
                    </div>

                    <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight font-headline mb-6 text-gradient leading-[1.15] drop-shadow-sm">
                        {t('landing_page.hero_title_part1')} <br className="hidden md:block" />
                        <span className="text-foreground">{t('landing_page.hero_title_part2')}</span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                        {t('landing_page.hero_subtitle')}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                       <Button size="lg" onClick={openModal} className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all">
                           {t('landing_page.get_started')} <Zap className="mx-2 w-5 h-5 rtl:rotate-180" />
                       </Button>
                       <Button size="lg" variant="outline" asChild className="h-12 px-8 text-lg rounded-full bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50">
                           <Link href="/guide">{t('landing_page.learn_more')}</Link>
                       </Button>
                    </div>

                    {/* ✅ اضافه کردن مودال مخفی برای زمانی که دکمه وسط صفحه کلیک می‌شود */}
                    <ConnectWalletModal 
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        connectors={connectors}
                        connect={connect}
                        isPending={isPending}
                        error={connectError}
                    />

                    {/* ✅ FIX: Translated Social Proof */}
                    <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap justify-center gap-8 md:gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <ShieldCheck className="w-5 h-5 text-green-500" /> {t('landing_page.audited_by')}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Globe className="w-5 h-5 text-blue-500" /> {t('landing_page.polygon_network')}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Bot className="w-5 h-5 text-purple-500" /> {t('landing_page.ai_powered')}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-24 relative">
                    <div className="absolute inset-0 bg-muted/30 skew-y-3 -z-10 transform origin-top-left" />
                    
                    <div className="container text-center">
                        <h2 className="text-3xl font-bold font-headline text-gradient mb-4">{t('landing_page.how_it_works_title')}</h2>
                        <p className="text-muted-foreground mb-16 max-w-xl mx-auto">{t('landing_page.how_it_works_subtitle')}</p>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center group">
                                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/10 border border-primary/20">
                                   <LinkIcon className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{t('landing_page.connect_participate_title')}</h3>
                                <p className="text-muted-foreground leading-relaxed px-4">{t('landing_page.connect_participate_desc')}</p>
                            </div>
                             <div className="flex flex-col items-center group">
                                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 text-purple-500 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/10 border border-purple-500/20">
                                   <Bot className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{t('landing_page.discover_analyze_title')}</h3>
                                <p className="text-muted-foreground leading-relaxed px-4">{t('landing_page.discover_analyze_desc')}</p>
                            </div>
                            <div className="flex flex-col items-center group">
                                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 text-green-500 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/10 border border-green-500/20">
                                    <TrendingUp className="w-10 h-10"/>
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{t('landing_page.vote_invest_title')}</h3>
                                <p className="text-muted-foreground leading-relaxed px-4">{t('landing_page.vote_invest_desc')}</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <FeaturedProposalsSection />
            </main>

            <footer className="py-12 border-t border-border/40 bg-background/50 backdrop-blur-sm">
                <div className="container">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Logo className="size-6 text-muted-foreground" />
                            <span className="font-bold text-muted-foreground">RayanChain</span>
                        </div>
                        <div className="flex gap-8 text-sm font-medium text-muted-foreground">
                            {/* ✅ FIX: Translated Footer Links */}
                            <Link href="/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</Link>
                            <Link href="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link>
                            <Link href="/guide" className="hover:text-primary transition-colors">{t('guide_page.title')}</Link>
                        </div>
                        <div className="text-sm text-muted-foreground opacity-60">
                            {/* ✅ FIX: Translated Copyright */}
                            {t('footer.copyright', { year: new Date().getFullYear() })}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}