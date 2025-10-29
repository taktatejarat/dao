// src/app/reports/page.tsx - FINAL, CORRECTED VERSION

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// This function remains outside as it doesn't depend on component state
const fetchAnalysis = async (proposalId: number) => {
  const response = await fetch(`/api/ai-report/${proposalId}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch AI report.');
  }
  return response.json();
};

export default function ReportsPage() {
    const { t } = useTranslation();
    const [proposalIdInput, setProposalIdInput] = useState<string>("1");
    const [queryId, setQueryId] = useState<number | null>(null);

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: ['proposalAnalysis', queryId],
        queryFn: () => fetchAnalysis(queryId!),
        enabled: !!queryId,
    });
    
    const handleStartAnalysis = () => {
        const id = parseInt(proposalIdInput, 10);
        if (!isNaN(id) && id > 0) {
            setQueryId(id);
        }
    };

    return (
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
                            value={proposalIdInput}
                            onChange={(e) => setProposalIdInput(e.target.value)}
                            min="1"
                        />
                        <Button onClick={handleStartAnalysis} disabled={isFetching || !proposalIdInput}>
                            {isFetching ? <DaoLoadingSpinner /> : t('reports_page.start_analysis')}
                        </Button>
                    </CardContent>
                </Card>

                {isFetching && (
                    <div className="flex justify-center p-8">
                        <DaoLoadingSpinner className="size-12" />
                    </div>
                )}
                
                {isError && !isFetching && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Fetching Report</AlertTitle>
                        <AlertDescription>{(error as Error).message}</AlertDescription>
                    </Alert>
                )}

                {data && !isFetching && queryId && (
                    <Card>
                        <CardHeader>
                            {/* ✅✅✅ THE FIX IS HERE ✅✅✅ */}
                            {/* We use string.replace() which is the standard way */}
                            <CardTitle>{t('reports_page.proposal_report_title').replace('{id}', queryId.toString())}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <StatCard title="AI Risk Score" value={data.ai_risk_score?.toFixed(2) || 'N/A'} description="Calculated risk based on project data" />
                                {/* You can add other stat cards here based on your AI response */}
                                {/* Example: */}
                                {/* <StatCard title="Collusion Risk" value={data.collusion_risk || 'Low'} description="Risk of coordinated voting" /> */}
                            </div>
                            <div>
                                <h3 className="font-semibold">Analysis Summary</h3>
                                <p className="text-sm text-muted-foreground">{data.summary || 'No summary available.'}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}