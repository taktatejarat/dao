// src/app/analytics/page.tsx - USER PROFILE 360

"use client";

import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, UserCheck, Search, Activity, ShieldAlert, Fingerprint } from 'lucide-react';
import { isAddress } from 'viem';
import { StatCard } from '@/components/dashboard/stat-card'; // ✅ New Import

interface UserReport {
    trust_score: number;
    anomaly_detected: boolean;
    report_key: string;
}

export default function UserAnalyticsPage() {
    const { t } = useTranslation();
    const [userAddress, setUserAddress] = useState('');
    const [report, setReport] = useState<UserReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = useCallback(async () => {
        if (!isAddress(userAddress)) { setError(t('analytics_page.invalid_address_error')); return; }
        setIsLoading(true); setError(null); setReport(null);
        try {
            const response = await fetch(`/api/analytics/user/${userAddress}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || t('analytics_page.fetch_error'));
            setReport(data.data);
        } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
    }, [userAddress, t]);

    return (
        <AppLayout>
            <div className="space-y-8 pb-10 max-w-4xl mx-auto">
                <header className="text-center space-y-4 py-8">
                    <div className="inline-flex p-4 rounded-full bg-primary/5 mb-2">
                        <Fingerprint className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold font-headline text-gradient">{t('analytics_page.title')}</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('analytics_page.subtitle')}</p>
                </header>

                {/* Search Box */}
                <Card className="border-primary/20 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="w-full relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                                <Input
                                    placeholder={t('analytics_page.search_placeholder')}
                                    value={userAddress}
                                    onChange={(e) => setUserAddress(e.target.value)}
                                    disabled={isLoading}
                                    className="pl-10 h-12 text-lg font-mono bg-muted/30"
                                />
                            </div>
                            <Button 
                                onClick={handleAnalysis} 
                                disabled={isLoading || !isAddress(userAddress)}
                                className="w-full sm:w-auto h-12 px-8 text-lg"
                            >
                                {isLoading ? <DaoLoadingSpinner className="mr-2" /> : t('analytics_page.analyze_button')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t('common.error')}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {/* Results Section */}
                {report && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <StatCard
                            title={t('analytics_page.trust_score')}
                            value={`${report.trust_score}/100`}
                            description={t('analytics_page.trust_score_desc')}
                            icon={UserCheck}
                            variant={report.trust_score > 70 ? 'positive' : report.trust_score > 40 ? 'warning' : 'negative'}
                        />
                        <StatCard
                            title={t('analytics_page.anomaly_status')}
                            value={report.anomaly_detected ? t('analytics_page.status_detected') : t('analytics_page.status_clean')}
                            description={t(report.report_key)}
                            icon={report.anomaly_detected ? ShieldAlert : Activity}
                            variant={report.anomaly_detected ? 'negative' : 'positive'}
                        />
                        
                        {/* Future: Add Graph Visualization Here */}
                        <Card className="md:col-span-2 border-dashed bg-muted/10 opacity-70">
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <p>{t('analytics_page.graph_coming_soon')}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}