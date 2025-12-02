// src/app/reports/page.tsx - RESTORED STRUCTURE & FIXED DATA MAPPING

"use client";

import { useRef, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BrainCircuit, AlertTriangle, CheckCircle, XCircle, ChevronLeft, Download, Share2, TrendingUp, Users, BarChart, Search, Copy } from 'lucide-react';
import { RiskGaugeChart } from '@/components/reports/risk-gauge-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { useTranslation } from '@/hooks/use-translation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { ProposalReportPDF } from '@/components/reports/pdf-template'; 
import { saveAs } from 'file-saver';


// --- Interfaces ---
interface XAIFactor {
    key: string;
    values?: Record<string, string | number>;
    importance?: number;
}

interface XAIReport {
    strengths: XAIFactor[];
    weaknesses: XAIFactor[];
    key_decision_factors: XAIFactor[];
    recommendation_key: string;
}

interface AIReport {
    investability_score: number;      
    overall_risk_level_key: string;   
    xai_report: XAIReport;
    risk_score?: number;
    success_probability?: number;
    team_competency_score?: number;
    market_sentiment_score?: number;
}

// ✅ اینترفیس جدید برای داده‌های پروپوزال
interface ProposalData {
    projectName: string;
    tagline: string;
    description: string;
    problem: string;
    solution: string;
    businessModel: string;
    startupIndustry: string;
    proposerAddress: string;
    milestones: { name: string; amount: string; durationDays: string }[];
    marketStats?: { tam: string; sam: string; som: string };
    financialStats?: { burnRate: string; revenueProj: string };
    teamBio?: string;
}

function ReportContent() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const reportRef = useRef<HTMLDivElement>(null);
    
    // حالت اولیه: اگر ID در URL بود آن را بگیر، وگرنه خالی
    const initialId = searchParams.get('id') || searchParams.get('proposalId') || '';
    const [inputId, setInputId] = useState(initialId);
    
    const [report, setReport] = useState<AIReport | null>(null);
    const [proposalData, setProposalData] = useState<ProposalData | null>(null); // ✅ استیت جدید
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //  FIX: استیت برای تشخیص قابلیت اشتراک‌گذاری
    const [canShare, setCanShare] = useState(false);

 useEffect(() => {
        if (typeof navigator !== 'undefined' && (navigator as any).share) setCanShare(true);
    }, []);

    const fetchReport = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setReport(null);
        setProposalData(null);

        try {
            // 1. دریافت تحلیل هوش مصنوعی
            const aiRes = await fetch(`/api/ai-report/${id}`);
            const aiDataJson = await aiRes.json();
            if (!aiRes.ok) throw new Error(aiDataJson.message || t('reports_page.error_title'));
            setReport(aiDataJson.data || aiDataJson);

            // 2. دریافت اطلاعات کامل پروپوزال (برای PDF)
            // فرض می‌کنیم روت /api/proposals/[id] وجود دارد و دیتای کامل می‌دهد
            console.log("Fetching proposal data for PDF...");
            const propRes = await fetch(`/api/proposals/${id}`);
            if (propRes.ok) {
                const propJson = await propRes.json();
                console.log("Proposal Data Received:", propJson.data); // ✅ لاگ برای دیباگ
                setProposalData(propJson.data);
            } else {
                console.warn("Failed to fetch proposal details for PDF");
            }

            const newUrl = `/reports?id=${id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);

        } catch (err) {
            console.error("Fetch Error:", err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialId) fetchReport(initialId);
    }, []);

    // --- تابع دانلود PDF جامع ---
    const handleDownloadPDF = async () => {
        if (!report || !proposalData) {
            toast.error("Proposal data is incomplete for PDF generation");
            return;
        }
        setPdfLoading(true);
        
        try {
            // ترجمه داده‌های هوش مصنوعی
            const processedReport = {
                ...report,
                overall_risk_level_label: t(report.overall_risk_level_key),
                recommendation_text: t(report.xai_report.recommendation_key + '_desc'),
                xai_report: {
                    ...report.xai_report,
                    strengths: report.xai_report.strengths.map(s => ({ ...s, display_text: tVar(s.key, s.values) })),
                    weaknesses: report.xai_report.weaknesses.map(w => ({ ...w, display_text: tVar(w.key, w.values) }))
                }
            };

            const blob = await pdf(
                <ProposalReportPDF 
                    report={processedReport} 
                    proposal={proposalData} // ✅ ارسال داده‌های پروپوزال
                    proposalId={inputId}
                    t={t}
                    locale={locale} // ✅ ارسال زبان برای فونت و جهت
                />
            ).toBlob();

            saveAs(blob, `RayanChain-FullReport-${inputId}.pdf`);
            toast.success(t('reports_page.pdf_downloaded_success') || "PDF Downloaded");

        } catch (err) {
            console.error("PDF Gen Error:", err);
            toast.error("Failed to generate PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    // --- تابع اشتراک‌گذاری ---

    // ✅ FIX: تابع هندل شیر با استفاده از as any
    const handleShare = async () => {
        const url = window.location.href;
        const title = `RayanChain AI Report #${inputId}`;
        const text = `Check out this AI analysis for proposal #${inputId}`;

        if (canShare) {
            try {
                // استفاده از as any برای رفع خطای تایپ‌اسکریپت
                await (navigator as any).share({ title, text, url });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') console.error('Share failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard!");
            } catch (err) {
                toast.error("Failed to copy link");
            }
        }
    };

    const tVar = (key: string, values?: Record<string, string | number>) => {
        let text = t(key);
        if (text === key) return key; 
        if (values) {
            Object.entries(values).forEach(([k, v]) => {
                text = text.replace(`{{${k}}}`, String(v));
            });
        }
        return text;
    };

    const getRiskColor = (key: string) => {
        if (!key) return 'text-muted-foreground';
        if (key.includes('low')) return 'text-green-600 bg-green-100 border-green-200';
        if (key.includes('medium')) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

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

                    {/* ✅ کانتینری که قرار است PDF شود */}
                    <div id="report-content" ref={reportRef} className="space-y-8 p-4 bg-background rounded-lg">
                        
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
                    </div> {/* End of report-content */}
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