
"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { ProposalsList } from '@/components/dashboard/proposals-list';
import { useTranslation } from '@/hooks/use-translation';

export default function ProposalsPage() {
    const { t } = useTranslation();
    
    return (
        <AppLayout>
             <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">{t('proposals_page.title')}</h1>
                <p className="text-muted-foreground">{t('proposals_page.subtitle')}</p>
            </header>
            <ProposalsList />
        </AppLayout>
    );
}
