// src/app/reports/page.tsx - FINAL, VISUAL DASHBOARD

"use client";

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { useTranslation } from '@/hooks/use-translation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Users, Bot, BarChart, CheckCircle, XCircle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RiskGaugeChart } from '@/components/reports/risk-gauge-chart';
import { useSearchParams } from 'next/navigation';

 interface XaiFactor {
  key: string;
  values?: { [key: string]: string | number }; // برای متغیرهایی مانند {{factor}}
}

interface XaiReport {
  strengths: XaiFactor[];
  weaknesses: XaiFactor[];
  recommendation_key: string;
}

interface AiReport {
  proposalId: string;
  projectName: string;
  summary: {
    investability_score: number;
    overall_risk_level_key: string; // ✅ FIX: از _key استفاده می‌کنیم
    xai_report: XaiReport;          // ✅ FIX: افزودن xai_report
  };
  financialAnalysis: {
    risk_score: number;
    success_probability: number;
    team_competency_score: number;
    market_sentiment_score: number;
    xai_factors: { feature: string; importance: number }[]; // ✅ FIX: تعریف نوع xai_factors
  };
  securityAnalysis: {
    trust_score: number;
    anomaly_detected: boolean;
    report_key: string; // ✅ FIX: استفاده از _key
  };
}

// --- Main Page Component ---
export default function ReportsPage() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const [proposalId, setProposalId] = useState(searchParams.get('id') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<AiReport | null>(null);

    // ✅✅✅ THE CRITICAL FIX IS HERE: حذف وابستگی 't' ✅✅✅
    const handleAnalysis = useCallback(async (idToAnalyze: string) => {
        if (!idToAnalyze) return;
        
        setIsLoading(true);
        setError(null);
        setReport(null);
        window.history.replaceState(null, '', `/reports?id=${idToAnalyze}`);

        try {
            const response = await fetch(`/api/ai-report/${idToAnalyze}`);
            if (!response.ok) {
                const errorData = await response.json();
                // استفاده از پیام خطای عمومی به جای t()
                throw new Error(errorData.message || 'Failed to fetch AI report.');
            }
            const data: AiReport = await response.json();
            setReport(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []); // <--- آرایه وابستگی اکنون خالی است و تابع پایدار است

    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl) {
            setProposalId(idFromUrl); 
            handleAnalysis(idFromUrl);
        }
    }, [searchParams, handleAnalysis]);

   const getRiskColor = (levelKey: string) => {
        if (levelKey.includes('low')) return 'text-green-500';
        if (levelKey.includes('medium')) return 'text-yellow-500';
        if (levelKey.includes('high')) return 'text-red-500';
        return 'text-muted-foreground';
    };

// --- کامپوننت جدید نمودار مدرج ---
const GradedGaugeChart = ({ value, label }: { value: number; label:string }) => {
    const percentage = value / 100;
    const endAngle = 180 - (percentage * 180); // محاسبه زاویه بر اساس مقدار

    // تعریف رنگ‌ها برای طیف
    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

    const getColor = (val: number) => {
        if (val < 20) return COLORS[0];
        if (val < 40) return COLORS[1];
        if (val < 60) return COLORS[2];
        if (val < 80) return COLORS[3];
        return COLORS[4];
    };
    return (
        <div className="relative flex flex-col items-center">
            <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                    {/* بخش پس‌زمینه خاکستری */}
                    <Pie
                        data={[{ value: 1 }]}
                        dataKey="value"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        fill="hsl(var(--muted))"
                        stroke="none"
                    />
                    {/* بخش رنگی که مقدار را نشان می‌دهد */}
                    <Pie
                        data={[{ value: 1 }]}
                        dataKey="value"
                        startAngle={180}
                        endAngle={endAngle}
                        innerRadius={60}
                        outerRadius={80}
                        fill={getColor(value)}
                        stroke="none"
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center">
                <p className="text-4xl font-bold" style={{ color: getColor(value) }}>{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
        </div>
    );
};

    // ✅✅✅ FIX: اصلاح تابع tVar برای جایگزینی صحیح ✅✅✅
    const tVar = (key: string, values?: { [key: string]: any }) => {
        let translation = t(key);
        if (values) {
            for (const k in values) {
                translation = translation.replace(`{{${k}}}`, values[k]);
            }
        }
        return translation;
    };

    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline text-gradient">{t('reports_page.title')}</h1>
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
                        {/* ✅ FIX: دکمه اکنون handleAnalysis را با ID از state فراخوانی می‌کند */}
                        <Button onClick={() => handleAnalysis(proposalId)} disabled={isLoading || !proposalId}>
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

                    {/* ✅✅✅ بخش خلاصه تحلیل (بازنویسی شده) ✅✅✅ */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bot /> {t('reports_page.ai_summary_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <RiskGaugeChart 
                                value={report.summary.investability_score} 
                                label={t('reports_page.investability_score')} 
                            />
                            <div className="space-y-6">
                                {/* ✅✅✅ FIX: نمایش بهبود یافته سطح ریسک و توصیه ✅✅✅ */}
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <p className="text-sm font-semibold text-muted-foreground">{t('reports_page.overall_risk_level')}</p>
                                    <p className={`font-bold text-2xl ${getRiskColor(report.summary.overall_risk_level_key)}`}>
                                        {t(report.summary.overall_risk_level_key)}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {t(report.summary.xai_report.recommendation_key + '_desc')}
                                    </p>
                                </div>
                                
                                {/* نمایش گزارش متنی XAI */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">{t('reports_page.xai_title')}:</h4>
                                    {/* ✅✅✅ FIX: نمایش نقاط قوت و ضعف از گزارش XAI ✅✅✅ */}
                                    {report.summary.xai_report.strengths.length > 0 && (
                                        <ul className="space-y-2">
                                            {report.summary.xai_report.strengths.map((item, index) => (
                                                <li key={`strength-${index}`} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                    <span>{tVar(item.key, item.values)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {report.summary.xai_report.weaknesses.length > 0 && (
                                        <ul className="space-y-2 mt-2">
                                            {report.summary.xai_report.weaknesses.map((item, index) => (
                                                <li key={`weakness-${index}`} className="flex items-start gap-2 text-sm">
                                                    <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                                    <span>{tVar(item.key, item.values)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
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