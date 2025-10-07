"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { StatCard } from '@/components/dashboard/stat-card';
import { AppLayout } from '@/components/layout/app-layout'; 

// Function to fetch the API (فرض می‌کنیم این API وجود دارد)
const fetchAnalysis = async (proposalId: number) => {
  const response = await fetch(`/api/ai-report/${proposalId}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export default function ReportsPage() {
    const { t } = useTranslation();
    const [proposalId, setProposalId] = useState<number>(1);
    const [queryId, setQueryId] = useState<number | null>(null);

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: ['proposalAnalysis', queryId],
        queryFn: () => fetchAnalysis(queryId!),
        enabled: !!queryId,
    });
    
    const handleStartAnalysis = () => {
        setQueryId(proposalId);
    };

    return (
        // ✅✅✅ ۲. قرار دادن کل محتوا در داخل AppLayout
        <AppLayout>
            <div className="space-y-6">
                <header>
                    <h1 className="text-3xl font-bold font-headline">{t('sidebar.ai_reports')}</h1>
                    <p className="text-muted-foreground">{t('reports_page.subtitle')}</p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('reports_page.card_title')}</CardTitle>
                        <CardDescription>{t('reports_page.card_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Input 
                            type="number"
                            placeholder={t('reports_page.input_placeholder')}
                            value={proposalId}
                            onChange={(e) => setProposalId(Number(e.target.value))}
                            min="1"
                        />
                        <Button onClick={handleStartAnalysis} disabled={isFetching}>
                            {isFetching ? <DaoLoadingSpinner /> : t('reports_page.start_analysis')}
                        </Button>
                    </CardContent>
                </Card>

                {isFetching && <div className="flex justify-center p-8"><DaoLoadingSpinner /></div>}
                
                {isError && !isFetching && <p className="text-red-500">{(error as Error).message}</p>}

                {data && !isFetching && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('reports_page.proposal_report_title').replace('{id}', queryId!.toString())}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <StatCard title={t('analytics_page.participation_rate')} value={`${data.participation_rate}%`} description={t('analytics_page.participation_rate_desc')} />
                                <StatCard title={t('analytics_page.voter_concentration')} value={`${data.voter_concentration}%`} description={t('analytics_page.voter_concentration_desc')} />
                                <StatCard title={t('analytics_page.voting_power_distribution')} value={data.voting_power_distribution.toFixed(2)} description={t('analytics_page.voting_power_distribution_desc')} />
                                <StatCard title={t('analytics_page.collusion_risk')} value={data.collusion_risk} description={t('analytics_page.collusion_risk_desc')} />
                                <StatCard title={t('reports_page.ai_risk_score')} value={data.ai_risk_score.toFixed(2)} description={t('reports_page.ai_risk_score_desc')} />
                            </div>
                            <div>
                                <h3 className="font-semibold">{t('analytics_page.summary_title')}</h3>
                                <p className="text-sm text-muted-foreground">{data.summary}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}