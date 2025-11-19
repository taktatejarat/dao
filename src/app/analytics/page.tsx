// src/app/analytics/page.tsx - نسخه نهایی و کامل

"use client";

import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, UserCheck, Search, BarChart } from 'lucide-react';
import { isAddress } from 'viem';
import { StatCard } from '@/components/dashboard/stat-card'; // استفاده مجدد از StatCard

// تعریف نوع داده برای گزارش کاربر
interface UserReport {
    trust_score: number;
    anomaly_detected: boolean;
    report_key: string;
    // در آینده می‌توان داده‌های بیشتری اضافه کرد
}

export default function UserAnalyticsPage() {
    const { t } = useTranslation();
    const [userAddress, setUserAddress] = useState('');
    const [report, setReport] = useState<UserReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = useCallback(async () => {
        if (!isAddress(userAddress)) {
            setError(t('analytics_page.invalid_address_error'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await fetch(`/api/analytics/user/${userAddress}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || t('analytics_page.fetch_error'));
            }
            setReport(data.data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [userAddress, t]);

    return (
        // ✅✅✅ FIX: افزودن AppLayout ✅✅✅
        <AppLayout>
            <div className="space-y-6">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('analytics_page.title')}</h1>
                    <p className="text-muted-foreground">{t('analytics_page.subtitle')}</p>
                </header>

                <Card className="card-glow">
                    <CardHeader>
                        <CardTitle>{t('analytics_page.card_title')}</CardTitle>
                        <CardDescription>{t('analytics_page.card_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                            <div className="w-full sm:flex-grow space-y-2">
                                <Label htmlFor="user-address">{t('analytics_page.label')}</Label>
                                <Input
                                    id="user-address"
                                    placeholder="0x..."
                                    value={userAddress}
                                    onChange={(e) => setUserAddress(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button onClick={handleAnalysis} disabled={isLoading || !isAddress(userAddress)}>
                                {isLoading ? <DaoLoadingSpinner className="mr-2" /> : <Search className="mr-2" />}
                                {t('analytics_page.analyze_button')}
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
                
                {/* بخش نمایش نتایج */}
                {report && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('analytics_page.report_title')}</CardTitle>
                            <CardDescription>{t('analytics_page.report_desc').replace('{address}', userAddress.slice(0, 10))}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <StatCard
                                title={t('analytics_page.trust_score')}
                                value={report.trust_score}
                                description={t('analytics_page.trust_score_desc')}
                                icon={UserCheck}
                                variant={report.trust_score > 70 ? 'positive' : 'default'}
                            />
                            <StatCard
                                title={t('analytics_page.anomaly_status')}
                                value={t(report.anomaly_detected ? 'common.yes' : 'common.no')}
                                description={t(report.report_key)}
                                icon={report.anomaly_detected ? AlertTriangle : BarChart}
                                variant={report.anomaly_detected ? 'negative' : 'neutral'}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}