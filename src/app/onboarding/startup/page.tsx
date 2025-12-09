// src/app/onboarding/startup/page.tsx

"use client";

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/context/UserContext';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Rocket, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation'; // ✅ هوک ترجمه

export default function StartupOnboarding() {
    const { t } = useTranslation(); // ✅ استفاده از ترجمه
    const { refreshProfile, isStartup } = useUser();
    const { address } = useAccount();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    const [companyName, setCompanyName] = useState('');

    const handleRegister = async () => {
        if (!companyName.trim()) {
            return toast.error(t('onboarding.error_empty_name')); // ✅ ترجمه خطا
        }
        
        setLoading(true);
        try {
            const res = await fetch('/api/profile/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address, 
                    role: 'startup',
                    extraData: { companyName }
                })
            });
            
            if (res.ok) {
                toast.success(t('onboarding.success_title'), {
                    description: t('onboarding.success_desc')
                }); // ✅ ترجمه پیام موفقیت
                await refreshProfile(); 
                router.push('/proposals/new'); 
            } else {
                throw new Error("Failed to upgrade");
            }
        } catch (e) {
            toast.error(t('onboarding.error_generic')); // ✅ ترجمه خطای عمومی
        } finally {
            setLoading(false);
        }
    };

    // حالت کاربری که قبلاً استارتاپ شده
    if (isStartup) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold font-headline text-gradient">
                        {t('onboarding.already_creator_title')}
                    </h1>
                    <Button className="mt-6" onClick={() => router.push('/proposals/new')}>
                        {t('onboarding.create_proposal_btn')}
                    </Button>
                </div>
            </AppLayout>
        );
    }

    // فرم ثبت نام
    return (
        <AppLayout>
            <div className="container max-w-4xl py-20 animate-in fade-in slide-in-from-bottom-4">
                <Card className="border-primary/20 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <Rocket className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{t('onboarding.title')}</CardTitle>
                        <CardDescription>
                            {t('onboarding.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>{t('onboarding.company_name_label')}</Label>
                            <Input 
                                placeholder={t('onboarding.company_name_placeholder')} 
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground leading-relaxed">
                            {t('onboarding.terms_notice')}
                        </div>

                        <Button className="w-full h-12 text-lg" onClick={handleRegister} disabled={loading}>
                            {loading ? <span className="animate-pulse">{t('onboarding.processing')}</span> : t('onboarding.submit_btn')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}