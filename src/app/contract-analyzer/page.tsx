// src/app/contract-analyzer/page.tsx - IDE STYLE

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
import { AlertTriangle, Lightbulb, Wrench, Code2, Check, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ... (Interface Suggestion remains same) ...
interface Suggestion {
    line: number;
    suggestion_key: string;
    severity: 'low' | 'medium' | 'high';
    values?: { [key: string]: string | number };
}

export default function ContractAnalyzerPage() {
    const { t } = useTranslation();
    const [contractCode, setContractCode] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = useCallback(async () => {
        // ... (Same logic as before) ...
        if (contractCode.trim().length < 50) { setError(t('contract_analyzer_page.code_too_short_error')); return; }
        setIsLoading(true); setError(null); setSuggestions([]);
        try {
            const response = await fetch('/api/analytics/contract', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: contractCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || t('contract_analyzer_page.fetch_error'));
            setSuggestions(data.data);
        } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
    }, [contractCode, t]);

    const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
        if (severity === 'high') return "bg-red-500/10 text-red-600 border-red-200";
        if (severity === 'medium') return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
        return "bg-blue-500/10 text-blue-600 border-blue-200";
    };

    // Helper for Translation Interpolation
    const tVar = (key: string, values?: any) => {
        let text = t(key);
        if (values) Object.entries(values).forEach(([k, v]) => text = text.replace(`{{${k}}}`, String(v)));
        return text;
    };

    return (
        <AppLayout>
            <div className="space-y-8 pb-10 max-w-6xl mx-auto">
                <header>
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('contract_analyzer_page.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('contract_analyzer_page.subtitle')}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Code Editor */}
                    <Card className="flex flex-col border-primary/20 shadow-lg h-full min-h-[500px]">
                        <CardHeader className="bg-muted/30 border-b pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-mono">
                                <Code2 className="w-4 h-4 text-primary" />
                                SmartContract.sol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 relative">
                            <Textarea
                                placeholder={t('contract_analyzer_page.editor_placeholder')}
                                className="h-full min-h-[500px] w-full resize-none border-0 rounded-none p-4 font-mono text-sm bg-card focus-visible:ring-0 leading-relaxed"
                                value={contractCode}
                                onChange={(e) => setContractCode(e.target.value)}
                                disabled={isLoading}
                                spellCheck={false}
                            />
                            <div className="absolute bottom-4 right-4">
                                <Button 
                                    onClick={handleAnalysis} 
                                    disabled={isLoading || contractCode.trim().length < 50}
                                    className="shadow-lg"
                                >
                                    {isLoading ? <DaoLoadingSpinner className="mr-2" /> : <Wrench className="mr-2 h-4 w-4" />}
                                    {t('contract_analyzer_page.analyze_button')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Analysis Results */}
                    <div className="space-y-4 h-full overflow-y-auto max-h-[600px] pr-2">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('contract_analyzer_page.analysis_error')}</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {suggestions.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold flex items-center gap-2"><Bug className="w-5 h-5 text-orange-500">{t('contract_analyzer_page.found_issues', { count: suggestions.length })}</Bug></h3>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">{t('common.ai_powered')}</Badge>
                                </div>
                                <div className="space-y-3">
                                    {suggestions.map((item, idx) => (
                                        <Card key={idx} className={cn("border-l-4 transition-all hover:shadow-md", getSeverityColor(item.severity).replace('bg-', 'border-l-').split(' ')[2])}>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge className={cn("uppercase text-[10px]", getSeverityColor(item.severity))}>
                                                        {item.severity} {t('common.risk')}
                                                    </Badge>
                                                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                                        {t('common.line')} {item.line}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed">
                                                    {tVar(item.suggestion_key, item.values)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        ) : (
                            // Empty State
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-xl opacity-50">
                                <Lightbulb className="w-12 h-12 mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-medium">{t('contract_analyzer_page.ready_to_analyze')}</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t('contract_analyzer_page.card_desc')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}