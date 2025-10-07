
"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';

export default function ContractAnalyzerPage() {
    const { t } = useTranslation();

    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">{t('contract_analyzer_page.title')}</h1>
                <p className="text-muted-foreground">{t('contract_analyzer_page.subtitle')}</p>
            </header>
            <Card className="border-l-4 border-secondary rtl:border-r-4 rtl:border-l-0">
                <CardHeader>
                    <CardTitle className="font-headline">{t('contract_analyzer_page.card_title')}</CardTitle>
                    <CardDescription>
                       {t('contract_analyzer_page.card_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="contract-code">{t('contract_analyzer_page.label')}</Label>
                        <Textarea 
                            id="contract-code" 
                            placeholder={t('contract_analyzer_page.placeholder')} 
                            className="min-h-[200px] text-left" 
                            dir="ltr" 
                        />
                    </div>
                    <Button disabled>{t('contract_analyzer_page.analyze_button')}</Button>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
