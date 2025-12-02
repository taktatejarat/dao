// src/app/reports/page.tsx - FINAL CORRECTED VERSION (Based on User Dictionary)

"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // اضافه شده برای فرم ورودی
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BrainCircuit, AlertTriangle, CheckCircle, XCircle, ChevronLeft, Download, Share2, TrendingUp, Users, BarChart, Copy, Search } from 'lucide-react';
import { RiskGaugeChart } from '@/components/reports/risk-gauge-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { useTranslation } from '@/hooks/use-translation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

// --- Interfaces ---
interface XAIFactor { key: string; values?: Record<string, string | number>; importance?: number; }
interface XAIReport { strengths: XAIFactor[]; weaknesses: XAIFactor[]; key_decision_factors: XAIFactor[]; recommendation_key: string; }
interface AIReport { investability_score: number; overall_risk_level_key: string; xai_report: XAIReport; risk_score?: number; success_probability?: number; team_competency_score?: number; market_sentiment_score?: number; }

function ReportContent() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // دریافت ID (اولیه)
    const initialId = searchParams.get('id') || searchParams.get('proposalId') || '';
    const [inputId, setInputId] = useState(initialId);
    
    const [report, setReport] = useState<AIReport | null>(null);
    const [proposalData, setProposalData] = useState<any>(null);
    
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && (navigator as any).share) setCanShare(true);
    }, []);

    // تابع اصلی دریافت گزارش
    const fetchReport = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setReport(null);
        setProposalData(null);

        try {
            // 1. دریافت تحلیل هوش مصنوعی
            const aiRes = await fetch(`/api/ai-report/${id}`);
            const aiDataResponse = await aiRes.json();
            
            if (!aiRes.ok) {
                if (aiRes.status === 404) throw new Error(t('reports_page.no_proposals_found'));
                throw new Error(aiDataResponse.message || t('reports_page.error_title'));
            }
            const aiCleanData = aiDataResponse.data || aiDataResponse;
            setReport(aiCleanData);

            // 2. دریافت اطلاعات کامل پروپوزال (برای PDF)
            try {
                const propRes = await fetch(`/api/proposals/${id}`);
                if (propRes.ok) {
                    const propJson = await propRes.json();
                    setProposalData(propJson.data);
                } else {
                    console.warn("Failed to fetch proposal details for PDF.");
                }
            } catch (e) {
                console.warn("Error fetching proposal details:", e);
            }

            // آپدیت URL
            const newUrl = `/reports?id=${id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);

        } catch (err) {
            console.error("Fetch Error:", err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // اگر با ID باز شد، اجرا شود
    useEffect(() => {
        if (initialId) fetchReport(initialId);
    }, []);

    // --- تابع ترجمه متغیرها ---
    const tVar = (key: string, values?: Record<string, string | number>) => {
        let text = t(key);
        if (!text || text === key) return key; 
        if (values) {
            Object.entries(values).forEach(([k, v]) => {
                text = text.replace(`{{${k}}}`, String(v));
            });
        }
        return text;
    };

    // --- تابع دانلود PDF ---
    const handleDownloadPDF = async () => {
        if (!report) return;
        if (!proposalData) {
            toast.warning(t('reports_page.analyzing_data')); // پیام موقت
        }
        setPdfLoading(true);
        
        try {
            // ساخت دیکشنری ترجمه‌ها (دقیقاً طبق فایل زبان ارسالی)
            const labels = {
                // Header & Footer
                rayan_chain_vc: t('common.rayan_chain_vc'),
                date: t('common.date'), 
                id: t('proposal_detail.proposal_id'), 
                generated_footer: t('common.generated_footer'), 

                // Page 1 Info
                industry: t('new_proposal_page.industry'),
                model: t('new_proposal_page.business_model'),
                website: t('new_proposal_page.website'),
                teamExp: t('new_proposal_page.team_experience_years_label'),
                
                details: t('proposal_detail.details'),
                full_description: t('proposal_detail.description'),
                problem: t('new_proposal_page.problem'),
                solution: t('new_proposal_page.solution'),

                // Page 2 Data
                data_analysis: t('reports_page.data_analysis'),
                market: t('new_proposal_page.tabs.market'),
                competitors: t('new_proposal_page.competitors'),
                
                financials: t('new_proposal_page.tabs.financials'),
                burn_rate: t('xai.feature.burn_rate'),
                revenue: t('new_proposal_page.financial_stats.revenue_label'),
                break_even: t('new_proposal_page.financial_stats.break_even_label'),
                
                milestones: t('proposal_detail.milestones'),
                milestone_name: t('proposal_detail.milestone'),
                duration: t('new_proposal_page.duration_days'),
                amount: t('new_proposal_page.amount'),

                // Page 3 AI
                ai_audit_report: t('reports_page.ai_audit_report'),
                ai_recommendation: t('reports_page.ai_recommendation'),
                investability_score: t('reports_page.investability_score'),
                overall_risk_level: t('reports_page.overall_risk_level'),
                
                // Key Metrics
                key_metrics: t('reports_page.financial_analysis_title'),
                success_probability: t('reports_page.success_probability'),
                financial_risk_score: t('reports_page.financial_risk_score'),
                team_competency: t('reports_page.team_competency'),
                market_sentiment: t('reports_page.market_sentiment'),
                strengths: t('reports_page.xai_strengths'),
                weaknesses: t('reports_page.xai_weaknesses'),               
                noData: t('reports_page.no_data'),
            };

            // پردازش داده‌ها
            const processedReport = {
                ...report,
                overall_risk_level_key: report.overall_risk_level_key, // کلید اصلی
                overall_risk_level_label: t(report.overall_risk_level_key), // متن ترجمه شده
                recommendation_text: t(report.xai_report.recommendation_key + '_desc'),
                xai_report: {
                    ...report.xai_report,
                    strengths: report.xai_report.strengths.map(s => ({ 
                        ...s, display_text: tVar(s.key, s.values) 
                    })),
                    weaknesses: report.xai_report.weaknesses.map(w => ({ 
                        ...w, display_text: tVar(w.key, w.values) 
                    }))
                }
            };

            // ارسال به API Puppeteer
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report: processedReport,
                    proposal: proposalData || {},
                    proposalId: inputId,
                    locale: locale,
                    labels: labels
                })
            });

            if (!response.ok) throw new Error("API Error");

            const blob = await response.blob();
            saveAs(blob, `RayanChain-Report-${inputId}.pdf`);
            toast.success(t('reports_page.pdf') + " " + t('status.succeeded')); // "ایجاد گزارش PDF انجام شد"

        } catch (err) {
            console.error(err);
            toast.error(t('reports_page.error_title'));
        } finally {
            setPdfLoading(false);
        }
    };

    // --- Share ---
    const handleShare = async () => {
        const url = window.location.href;
        const title = `RayanChain AI Report #${inputId}`;
        const text = `Check out this AI analysis for proposal #${inputId}`;
        if (canShare) {
            try { await (navigator as any).share({ title, text, url }); } catch (err) {}
        } else {
            try { await navigator.clipboard.writeText(url); toast.success("Link copied!"); } catch (err) {}
        }
    };

    const getRiskColor = (key: string) => {
        if (!key) return 'text-muted-foreground';
        if (key.includes('low')) return 'text-green-600 bg-green-100 border-green-200';
        if (key.includes('medium')) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

    // --- Render ---
    
    // اگر ID نداریم، فرم جستجو نشان بده
    if (!inputId && !initialId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Card className="w-full max-w-md p-6 border-primary/20 shadow-lg">
                    <h2 className="text-xl font-bold mb-2 text-center text-primary">{t('reports_page.card_title')}</h2>
                    <p className="text-sm text-muted-foreground text-center mb-6">{t('reports_page.card_desc')}</p>
                    <div className="flex gap-2">
                        <Input 
                            value={inputId} 
                            onChange={e => setInputId(e.target.value)} 
                            placeholder={t('reports_page.input_placeholder')} 
                            className="text-center"
                        />
                    </div>
                    <Button className="w-full mt-4" onClick={() => fetchReport(inputId)} disabled={!inputId}>
                        {t('reports_page.start_analysis')}
                    </Button>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <DaoLoadingSpinner className="w-16 h-16 text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">{t('reports_page.analyzing_data')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('reports_page.error_title')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>{t('common.back') || "Back"}</Button>
            </Alert>
        );
    }

    if (!report) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col gap-6">
                <header>
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('reports_page.title')}</h1>
                    <p className="text-muted-foreground">{t('reports_page.subtitle')}</p>
                </header>

                <Card className="border-primary/20 shadow-sm">
                    <CardHeader>
                        <CardTitle>{t('reports_page.card_title')}</CardTitle>
                        <CardDescription>{t('reports_page.card_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder={t('reports_page.input_placeholder')} 
                            value={inputId}
                            onChange={(e) => setInputId(e.target.value)}
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button onClick={() => fetchReport(inputId)} disabled={loading || !inputId} className="min-w-[140px]">
                            {loading ? <DaoLoadingSpinner className="me-2"/> : <Search className="me-2 h-4 w-4"/>}
                            {t('reports_page.start_analysis')}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('reports_page.error_title')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {report && (
                <div className="space-y-8">
                    {/* Actions Row */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
                            {pdfLoading ? <DaoLoadingSpinner className="mr-2 h-4 w-4"/> : <Download className="mr-2 h-4 w-4"/>}
                            {t('reports_page.pdf')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleShare}>
                            {/* آیکون هوشمند: اگر Share API نبود، آیکون Copy نشان بده */}
                            {canShare ? <Share2 className="mr-2 h-4 w-4"/> : <Copy className="mr-2 h-4 w-4"/>}
                        {t('reports_page.share')}
                        </Button>
                    </div>
                        
                        {/* 1. Main Score Card */}
                        <Card className="border-primary/20 shadow-lg bg-card/50">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl flex items-center gap-2">
                                            <BrainCircuit className="text-primary h-6 w-6" />
                                            {t('reports_page.ai_summary_title')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t('reports_page.proposal_report_title').replace('{id}', inputId)}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className={cn("text-lg px-4 py-1", getRiskColor(report.overall_risk_level_key))}>
                                        {t(report.overall_risk_level_key)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="flex justify-center">
                                    <RiskGaugeChart 
                                        value={report.investability_score} 
                                        label={t('reports_page.investability_score')} 
                                    />
                                </div>
                                <div className="space-y-6">
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <h3 className="font-semibold mb-2 text-primary">{t('reports_page.ai_recommendation')}</h3>
                                        <p className="text-muted-foreground leading-relaxed text-sm">
                                            {t(report.xai_report.recommendation_key + '_desc')}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-2 bg-muted/30 rounded">
                                            <span className="text-xs text-muted-foreground block">{t('reports_page.overall_risk_level')}</span>
                                            <span className={cn("font-bold", getRiskColor(report.overall_risk_level_key))}>
                                                {t(report.overall_risk_level_key)}
                                            </span>
                                        </div>
                                        <div className="text-center p-2 bg-muted/30 rounded">
                                            <span className="text-xs text-muted-foreground block">{t('reports_page.ai_risk_score')}</span>
                                            <span className="font-bold">{report.risk_score ?? 'N/A'}/100</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Financial & Team Stats */}
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5" />
                                {t('reports_page.financial_analysis_title')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard 
                                    icon={BarChart} 
                                    title={t('reports_page.success_probability')} 
                                    value={`${report.success_probability ?? 0}%`} 
                                    description={t('reports_page.success_probability_desc')}
                                    variant="default"
                                />
                                <StatCard 
                                    icon={AlertTriangle} 
                                    title={t('reports_page.financial_risk_score')} 
                                    value={`${report.risk_score ?? 0} / 100`} 
                                    description={t('reports_page.financial_risk_score_desc')}
                                    variant={report.risk_score && report.risk_score > 50 ? "negative" : "positive"}
                                />
                                <StatCard 
                                    icon={Users} 
                                    title={t('reports_page.team_competency')} 
                                    value={`${report.team_competency_score ?? 0} / 100`} 
                                    description={t('reports_page.team_competency_desc')}
                                    variant="neutral"
                                />
                                <StatCard 
                                    icon={TrendingUp} 
                                    title={t('reports_page.market_sentiment')} 
                                    value={report.market_sentiment_score ? `${(report.market_sentiment_score * 100).toFixed(0)}%` : 'N/A'} 
                                    description={t('reports_page.market_sentiment_desc')}
                                    variant="neutral"
                                />
                            </div>
                        </div>
                        {/* 3. Detailed Factors (xAI) */}
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <BrainCircuit className="w-5 h-5" />
                                {t('reports_page.xai_title')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <Card className="border-l-4 border-l-green-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            {t('reports_page.xai_strengths')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 pt-2">
                                        {report.xai_report.strengths.length > 0 ? report.xai_report.strengths.map((item, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm bg-green-50/50 p-2 rounded">
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                                                <span className="font-medium text-foreground">
                                                    {tVar(item.key, item.values)}
                                                </span>
                                            </div>
                                        )) : (
                                            // ✅ اصلاح شد: استفاده از کلید ترجمه
                                            <p className="text-muted-foreground text-sm italic">
                                                {t('reports_page.no_data')}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Weaknesses */}
                                <Card className="border-l-4 border-l-red-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                                            <XCircle className="w-5 h-5" />
                                            {t('reports_page.xai_weaknesses')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 pt-2">
                                        {report.xai_report.weaknesses.length > 0 ? report.xai_report.weaknesses.map((item, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm bg-red-50/50 p-2 rounded">
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                                                <span className="font-medium text-foreground">
                                                    {tVar(item.key, item.values)}
                                                </span>
                                            </div>
                                        )) : (
                                            // ✅ اصلاح شد: استفاده از کلید ترجمه
                                            <p className="text-muted-foreground text-sm italic">
                                                {t('reports_page.no_risks_found')}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                </div>
            )}
        </div>
    );
}

export default function ReportsPage() {
    return (
        <AppLayout>
            <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><DaoLoadingSpinner /></div>}>
                <ReportContent />
            </Suspense>
        </AppLayout>
    );
}