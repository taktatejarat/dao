// src/app/reports/page.tsx - FINAL, VISUAL DASHBOARD

"use client";


import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { useTranslation } from '@/hooks/use-translation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Users, Bot, BarChart } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Type Definition for the AI Report Data ---
interface AiReport {
    proposalId: string;
    projectName: string;
    summary: {
        investability_score: number;
        overall_risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
        ai_recommendation: string;
    };
    financialAnalysis: {
        risk_score: number;
        success_probability: number;
        team_competency_score: number;
        market_sentiment_score: number;
        summary: string;
    };
    securityAnalysis: {
        trust_score: number;
        anomaly_detected: boolean;
        reason: string;
    };
}

// --- Helper Component: Gauge Chart ---
const GaugeChart = ({ value, label, color }: { value: number; label: string, color: string }) => {
    const data = [
        { name: 'Value', value: value },
        { name: 'Remaining', value: 100 - value },
    ];
    return (
        <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="70%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell key="value" fill={color} />
                        <Cell key="remaining" fill="hsl(var(--muted))" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <p className="text-2xl font-bold -mt-16">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
    );
};

// --- Main Page Component ---
export default function ReportsPage() {
    const { t } = useTranslation();
    const [proposalId, setProposalId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<AiReport | null>(null);

    const handleAnalysis = async () => {
        if (!proposalId) return;
        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await fetch(`/api/ai-report/${proposalId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch report.');
            }
            const data: AiReport = await response.json();
            setReport(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'Low': return 'text-green-500';
            case 'Medium': return 'text-yellow-500';
            case 'High': return 'text-orange-500';
            case 'Very High': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    };


    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">{t('reports_page.title')}</h1>
                <p className="text-muted-foreground">{t('reports_page.subtitle')}</p>
            </header>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>{t('reports_page.card_title')}</CardTitle>
                    <CardDescription>{t('reports_page.card_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder={t('reports_page.input_placeholder')}
                            value={proposalId}
                            onChange={(e) => setProposalId(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button onClick={handleAnalysis} disabled={isLoading || !proposalId}>
                            {isLoading && <DaoLoadingSpinner className="me-2" />}
                            {t('reports_page.start_analysis')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive" className="mt-6 max-w-4xl mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    {/* ✅ FIX: استفاده از ترجمه */}
                    <AlertTitle>{t('reports_page.error_title')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {report && (
                <div className="mt-8 space-y-6">
                    <h2 className="text-2xl font-bold text-center">
                        {t('reports_page.proposal_report_title').replace('{id}', report.proposalId)}: 
                        <span className="text-primary ml-2">{report.projectName}</span>
                    </h2>

                    {/* Summary Section */}
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bot /> {t('reports_page.ai_summary_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <GaugeChart value={report.summary.investability_score} label={t('reports_page.investability_score')} color="hsl(var(--primary))" />
                            <div className="md:col-span-2 space-y-4">
                                <p><strong>{t('reports_page.overall_risk_level')}:</strong> <span className={`font-bold ${getRiskColor(report.summary.overall_risk_level)}`}>{report.summary.overall_risk_level}</span></p>
                                <p><strong>{t('reports_page.ai_recommendation')}:</strong> <span className="text-muted-foreground">{report.summary.ai_recommendation}</span></p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial & Team Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><TrendingUp /> {t('reports_page.financial_analysis_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard 
                                icon={BarChart} 
                                title={t('reports_page.success_probability')} 
                                value={`${report.financialAnalysis.success_probability}%`} 
                                description={t('reports_page.success_probability_desc')} 
                                variant="positive"
                                isLoading={isLoading} // ✅ پاس دادن وضعیت لودینگ
                            />
                            <StatCard 
                                icon={AlertTriangle} 
                                title={t('reports_page.financial_risk_score')} 
                                value={`${report.financialAnalysis.risk_score} / 100`}
                                description={t('reports_page.financial_risk_score_desc')} 
                                variant={report.financialAnalysis.risk_score > 60 ? "negative" : "default"} // ✅ رنگ‌بندی شرطی
                                isLoading={isLoading}
                            />
                            <StatCard 
                                icon={Users} 
                                title={t('reports_page.team_competency')} 
                                value={`${report.financialAnalysis.team_competency_score} / 100`}
                                description={t('reports_page.team_competency_desc')} 
                                variant="neutral"
                                isLoading={isLoading}
                            />
                            <StatCard 
                                icon={TrendingUp} 
                                title={t('reports_page.market_sentiment')} 
                                value={isNaN(report.financialAnalysis.market_sentiment_score) ? 'N/A' : `${(report.financialAnalysis.market_sentiment_score * 100).toFixed(0)}%`}
                                description={t('reports_page.market_sentiment_desc')} 
                                isLoading={isLoading}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}