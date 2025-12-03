// src/app/proposals/page.tsx - CLEAN WRAPPER

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { ProposalsList } from '@/components/dashboard/proposals-list';
import { useTranslation } from '@/hooks/use-translation';
import { StatCard } from '@/components/dashboard/stat-card';
import { FileText } from 'lucide-react';

export default function ProposalsPage() {
    const { t } = useTranslation();
    
    return (
        <AppLayout>
            <div className="space-y-8 max-w-6xl mx-auto">
                <header className="flex items-center gap-4 py-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-gradient">{t('proposals_page.title')}</h1>
                        <p className="text-muted-foreground">{t('proposals_page.subtitle')}</p>
                    </div>
                </header>

                {/* Proposals List Component (It handles fetching & filtering internally now) */}
                <ProposalsList limit={100} /> {/* Show all */}
            </div>
        </AppLayout>
    );
}