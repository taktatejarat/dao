
"use client";

import { Button } from "@/components/ui/button";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowRight, Bot, ShieldCheck, TrendingUp, Zap, Languages, Sun, Moon, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/LanguageProvider";
import { useTheme } from "next-themes";
import { Logo } from "@/components/icons/logo";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function LandingPage() {
    const { t } = useTranslation();
    const { setTheme, theme } = useTheme();
    const { direction } = useLanguage();
    const { openConnectModal } = useConnectModal();

    const featureList = [
        { icon: Bot, titleKey: 'landing_page.ai_evaluation_title', descriptionKey: 'landing_page.ai_evaluation_desc' },
        { icon: ShieldCheck, titleKey: 'landing_page.blockchain_security_title', descriptionKey: 'landing_page.blockchain_security_desc' },
        { icon: TrendingUp, titleKey: 'landing_page.exclusive_opportunities_title', descriptionKey: 'landing_page.exclusive_opportunities_desc' },
    ];

    const proposalList = [
        { titleKey: 'landing_page.next_gen_defi_title', descriptionKey: 'landing_page.next_gen_defi_desc', statusKey: 'landing_page.investing' },
        { titleKey: 'landing_page.nft_marketplace_title', descriptionKey: 'landing_page.nft_marketplace_desc', statusKey: 'landing_page.coming_soon' },
        { titleKey: 'landing_page.digital_identity_title', descriptionKey: 'landing_page.digital_identity_desc', statusKey: 'landing_page.finished' },
    ];

    return (
        <div dir={direction} className="bg-background text-foreground min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center">
                    <div className="flex items-center gap-2">
                        <Logo className="size-8 text-primary" />
                        <span className="text-xl font-bold font-headline">RayanChain</span>
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
                        <h2 className="text-3xl font-bold font-headline mb-4">{t('landing_page.how_it_works_title')}</h2>
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
                <section className="py-20">
                    <div className="container">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold font-headline">{t('landing_page.featured_proposals_title')}</h2>
                            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">{t('landing_page.featured_proposals_subtitle')}</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {proposalList.map((proposal) => (
                                <Card key={proposal.titleKey} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{t(proposal.titleKey)}</CardTitle>
                                        <CardDescription className="flex-grow pt-2">{t(proposal.descriptionKey)}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="flex justify-between items-center mt-auto pt-4">
                                        <Badge variant={proposal.statusKey === 'landing_page.investing' ? 'success' : 'secondary'}>
                                            {t(proposal.statusKey)}
                                        </Badge>
                                        <Button variant="outline" size="sm">
                                            {t('view_details')}
                                            <ArrowRight className="mx-2 rtl:rotate-180 size-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-6 border-t">
                <div className="container text-center text-muted-foreground">
                    {t('landing_page.footer_copy').replace('{year}', new Date().getFullYear().toString())}
                </div>
            </footer>
        </div>
    );
}
