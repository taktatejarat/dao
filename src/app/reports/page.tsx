// src/app/reports/page.tsx - FINAL REDESIGNED & TYPE-SAFE

"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    BrainCircuit, AlertTriangle, CheckCircle, XCircle, 
    Download, Share2, TrendingUp, Users, BarChart2, 
    Search, Target, Copy
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { useTranslation } from '@/hooks/use-translation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';

// --- Interfaces ---
interface XAIFactor { key: string; values?: Record<string, string | number>; importance?: number; }
interface XAIReport { strengths: XAIFactor[]; weaknesses: XAIFactor[]; key_decision_factors: XAIFactor[]; recommendation_key: string; }
interface AIReport { investability_score: number; overall_risk_level_key: string; xai_report: XAIReport; risk_score?: number; success_probability?: number; team_competency_score?: number; market_sentiment_score?: number; }

// --- Helper for Type-Safe Translation ---
const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    // این تابع، تابع اصلی را کست می‌کند تا تایپ‌اسکریپت به تعداد آرگومان‌ها گیر ندهد
    const t = (key: string, params?: any) => (originalT as any)(key, params);
    return { t, locale };
};

// --- Custom Circular Score Component (Modern UI) ---
const ScoreRing = ({ score, label }: { score: number, label: string }) => {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(score, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    // رنگ‌بندی داینامیک بر اساس امتیاز
    let colorClass = "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
    if (score >= 50) colorClass = "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]";
    if (score >= 75) colorClass = "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";

    return (
        <div className="relative flex flex-col items-center justify-center w-48 h-48">
            <svg className="transform -rotate-90 w-full h-full">
                {/* Background Circle */}
                <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/10" />
                {/* Progress Circle */}
                <circle 
                    cx="50%" cy="50%" r={radius} 
                    stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    className={cn("transition-all duration-1000 ease-out", colorClass)}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={cn("text-4xl font-extrabold font-headline", colorClass.split(' ')[0])}>{score}</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{label}</span>
            </div>
        </div>
    );
};

function ReportContent() {
    const { t, locale } = useSafeTranslation(); // ✅ استفاده از هوک اصلاح شده
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const initialId = searchParams.get('id') || searchParams.get('proposalId') || '';
    const [inputId, setInputId] = useState(initialId);
    
    const [report, setReport] = useState<AIReport | null>(null);
    const [proposalData, setProposalData] = useState<any>(null); // برای PDF
    
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
            const aiDataResponse = await aiRes.json();
            
            if (!aiRes.ok) {
                if (aiRes.status === 404) throw new Error(t('reports_page.no_proposals_found'));
                throw new Error(aiDataResponse.message || t('reports_page.error_title'));
            }
            const aiCleanData = aiDataResponse.data || aiDataResponse;
            setReport(aiCleanData);

            // 2. دریافت اطلاعات پروپوزال برای PDF
            try {
                const propRes = await fetch(`/api/proposals/${id}`);
                if (propRes.ok) {
                    const propJson = await propRes.json();
                    setProposalData(propJson.data);
                }
            } catch (e) { console.warn("Proposal fetch error", e); }

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

    // Helper: جایگذاری متغیرها در ترجمه
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

    const getRiskColor = (key: string) => {
        if (!key) return 'text-muted-foreground border-muted';
        if (key.includes('low')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (key.includes('medium')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    };

    // --- PDF Handler ---
    const handleDownloadPDF = async () => {
        if (!report) return;
        setPdfLoading(true);
        try {
            // ساخت دیکشنری ترجمه‌ها برای PDF Generator
            const labels = {
                // Header & Footer
                rayan_chain_vc: t('common.rayan_chain_vc'),
                date: t('common.date'), 
                id: t('proposal_detail.proposal_id'), 
                generated_footer: t('proposal_detail.generated_footer'), 

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
                noData: t('reports_page.no_data')
            };

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report,
                    proposal: proposalData || {},
                    proposalId: inputId,
                    locale,
                    labels
                })
            });

            if (!response.ok) throw new Error("API Error");
            const blob = await response.blob();
            saveAs(blob, `RayanChain-Report-${inputId}.pdf`);
            toast.success(t('status.succeeded'));

        } catch (err) {
            console.error(err);
            toast.error(t('reports_page.error_title'));
        } finally {
            setPdfLoading(false);
        }
    };

    // --- Share Handler ---
    const handleShare = async () => {
        const url = window.location.href;
        if (canShare) {
            try { await (navigator as any).share({ title: 'AI Report', url }); } catch (err) {}
        } else {
            try { await navigator.clipboard.writeText(url); toast.success("Link copied!"); } catch (err) {}
        }
    };

    // --- UI STATES ---

    // 1. Search Mode
    if (!inputId && !initialId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in zoom-in-95 duration-500">
                <div className="p-6 rounded-full bg-primary/5 mb-2 animate-pulse-slow">
                    <BrainCircuit className="w-12 h-12 text-primary animate-pulse-medium" />
                </div>
                <div className="text-center max-w-lg space-y-2">
                    <h2 className="text-2xl font-bold text-gradient font-headline">{t('reports_page.card_title')}</h2>
                    <p className="text-muted-foreground">{t('reports_page.card_desc')}</p>
                </div>
                <Card className="w-full max-w-md p-2 border-primary/20 shadow-xl">
                    <div className="flex gap-2">
                        <Input 
                            value={inputId} 
                            onChange={e => setInputId(e.target.value)} 
                            placeholder={t('reports_page.input_placeholder')} 
                            className="border-0 focus-visible:ring-0 bg-transparent text-lg text-center"
                        />
                    </div>
                    <Button className="w-full mt-2 h-12 text-lg" onClick={() => fetchReport(inputId)} disabled={!inputId}>
                        {t('reports_page.start_analysis')}
                    </Button>
                </Card>
            </div>
        );
    }

    // 2. Loading Mode
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="relative">
                    <DaoLoadingSpinner className="w-20 h-20 text-primary opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                </div>
                <p className="text-lg font-medium text-muted-foreground animate-pulse">{t('reports_page.analyzing_data')}</p>
            </div>
        );
    }

    // 3. Error Mode
    if (error) {
        return (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('reports_page.error_title')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button variant="outline" className="mt-4 bg-background/50" onClick={() => router.back()}>{t('common.back')}</Button>
            </Alert>
        );
    }

    if (!report) return null;

    // 4. Report View (Bento Grid)
    return (
        <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary" className="font-mono text-xs px-3 py-1 bg-muted/80">ID: {inputId.substring(0, 8)}...</Badge>
                        <Badge variant="outline" className={cn("text-xs px-3 py-1 font-bold uppercase", getRiskColor(report.overall_risk_level_key))}>
                            {t(report.overall_risk_level_key)}
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gradient leading-tight">{t('reports_page.ai_audit_report')}</h1>
                    <p className="text-lg text-muted-foreground mt-2">{t('reports_page.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleDownloadPDF} disabled={pdfLoading} className="h-10 gap-2">
                        {pdfLoading ? <DaoLoadingSpinner className="w-4 h-4"/> : <Download className="w-4 h-4"/>} 
                        {t('reports_page.pdf')}
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="h-10 w-10 p-0">
                        {canShare ? <Share2 className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                    </Button>
                </div>
            </div>

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* A. Overall Score (Large Box) - Col Span 4 */}
                <Card className="md:col-span-12 lg:col-span-4 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-card to-muted/30 border-primary/20 shadow-lg">
                    <ScoreRing score={report.investability_score} label={t('reports_page.investability_score')} />
                    
                    <div className="grid grid-cols-2 gap-4 w-full mt-8 pt-6 border-t border-border/50">
                        <div className="text-center">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">{t('reports_page.overall_risk_level')}</span>
                            <span className={cn("font-bold text-lg", getRiskColor(report.overall_risk_level_key).replace('bg-', 'text-').replace('/10', ''))}>
                                {t(report.overall_risk_level_key)}
                            </span>
                        </div>
                        <div className="text-center border-l border-border/50">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">{t('reports_page.ai_risk_score')}</span>
                            <span className="font-bold text-lg">{report.risk_score ?? '-'} / 100</span>
                        </div>
                    </div>
                </Card>

                {/* B. Key Metrics (4 Small Cards) - Col Span 8 */}
                <div className="md:col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                    <StatCard 
                        title={t('reports_page.success_probability')} 
                        value={`${report.success_probability ?? 0}%`} 
                        icon={Target} 
                        variant={report.success_probability && report.success_probability > 70 ? "positive" : "neutral"}
                        description={t('reports_page.success_probability_desc')}
                    />
                    <StatCard 
                        title={t('reports_page.market_sentiment')} 
                        value={`${(report.market_sentiment_score ? report.market_sentiment_score * 100 : 0).toFixed(0)}%`} 
                        icon={TrendingUp} 
                        variant="default"
                        description={t('reports_page.market_sentiment_desc')}
                    />
                    <StatCard 
                        title={t('reports_page.team_competency')} 
                        value={`${report.team_competency_score ?? 0}/100`} 
                        icon={Users} 
                        variant="neutral"
                        description={t('reports_page.team_competency_desc')}
                    />
                    <StatCard 
                        title={t('reports_page.financial_risk_score')} 
                        value={`${report.risk_score ?? 0}/100`} 
                        icon={AlertTriangle} 
                        variant={report.risk_score && report.risk_score > 50 ? "negative" : "positive"}
                        description={t('reports_page.financial_risk_score_desc')}
                    />
                </div>

                {/* C. AI Recommendation (Full Width) */}
                <Card className="md:col-span-12 bg-primary/5 border-primary/20 shadow-inner">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-primary text-lg">
                            <BrainCircuit className="w-5 h-5" /> 
                            {t('reports_page.ai_recommendation')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium leading-relaxed text-foreground/90">
                            {t(report.xai_report.recommendation_key + '_desc')}
                        </p>
                    </CardContent>
                </Card>

                {/* D. Strengths (xAI) */}
                <Card className="md:col-span-6 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-emerald-600 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> 
                            {t('reports_page.xai_strengths')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {report.xai_report.strengths.length > 0 ? report.xai_report.strengths.map((item, i) => (
                            <div key={i} className="flex gap-4 items-start p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10">
                                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm">{tVar(item.key, item.values)}</p>
                                    {/* اگر توضیحاتی در آینده اضافه شد */}
                                </div>
                            </div>
                        )) : <p className="text-muted-foreground italic text-sm p-4 text-center">{t('reports_page.no_data')}</p>}
                    </CardContent>
                </Card>

                {/* E. Weaknesses (xAI) */}
                <Card className="md:col-span-6 border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-rose-600 flex items-center gap-2">
                            <XCircle className="w-5 h-5" /> 
                            {t('reports_page.xai_weaknesses')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {report.xai_report.weaknesses.length > 0 ? report.xai_report.weaknesses.map((item, i) => (
                            <div key={i} className="flex gap-4 items-start p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/10">
                                <div className="mt-1 h-2 w-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm">{tVar(item.key, item.values)}</p>
                                </div>
                            </div>
                        )) : <p className="text-muted-foreground italic text-sm p-4 text-center">{t('reports_page.no_risks_found')}</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <AppLayout>
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><DaoLoadingSpinner className="w-12 h-12 text-primary" /></div>}>
                <ReportContent />
            </Suspense>
        </AppLayout>
    );
}