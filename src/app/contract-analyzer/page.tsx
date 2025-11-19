// src/app/contract-analyzer/page.tsx - نسخه نهایی و کامل

"use client";

import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Lightbulb, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// تعریف نوع داده برای پیشنهاد بهبود
interface Suggestion {
    line: number;
    suggestion_key: string;
    severity: 'low' | 'medium' | 'high';
    // مقادیر داینامیک برای جایگزینی در متن ترجمه
    values?: { [key: string]: string | number };
}

export default function ContractAnalyzerPage() {
    const { t } = useTranslation();
    const [contractCode, setContractCode] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = useCallback(async () => {
        if (contractCode.trim().length < 50) {
            setError(t('contract_analyzer_page.code_too_short_error'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuggestions([]);

        try {
            const response = await fetch('/api/analytics/contract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: contractCode }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || t('contract_analyzer_page.fetch_error'));
            }
            setSuggestions(data.data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [contractCode, t]);

    const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
        if (severity === 'high') return <Badge variant="destructive">{t('common.high')}</Badge>;
        if (severity === 'medium') return <Badge variant="secondary">{t('common.medium')}</Badge>;
        return <Badge variant="outline">{t('common.low')}</Badge>;
    };
    
    // تابع کمکی برای جایگزینی متغیرها در متن ترجمه
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
            <div className="space-y-6">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('contract_analyzer_page.title')}</h1>
                    <p className="text-muted-foreground">{t('contract_analyzer_page.subtitle')}</p>
                </header>

                <Card className="card-glow">
                    <CardHeader>
                        <CardTitle>{t('contract_analyzer_page.card_title')}</CardTitle>
                        <CardDescription>{t('contract_analyzer_page.card_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="contract-code">{t('contract_analyzer_page.label')}</Label>
                            <Textarea
                                id="contract-code"
                                placeholder={t('contract_analyzer_page.placeholder')}
                                className="min-h-[250px] font-mono text-sm"
                                value={contractCode}
                                onChange={(e) => setContractCode(e.target.value)}
                                disabled={isLoading}
                                dir="ltr"
                            />
                        </div>
                        <Button onClick={handleAnalysis} disabled={isLoading || contractCode.trim().length < 50}>
                            {isLoading ? <DaoLoadingSpinner className="mr-2" /> : <Wrench className="mr-2" />}
                            {t('contract_analyzer_page.analyze_button')}
                        </Button>
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
                {suggestions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('contract_analyzer_page.suggestions_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {suggestions.map((suggestion, index) => (
                                <Alert key={index}>
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertTitle className="flex items-center justify-between">
                                        <span>{t('contract_analyzer_page.line')} {suggestion.line}</span>
                                        {getSeverityBadge(suggestion.severity)}
                                    </AlertTitle>
                                    <AlertDescription>
                                        {tVar(suggestion.suggestion_key, suggestion.values)}
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}