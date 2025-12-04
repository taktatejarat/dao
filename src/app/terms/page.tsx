// src/app/terms/page.tsx - FINAL I18N & API INTEGRATED

"use client";

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, FileSignature } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useAccount, useSignMessage } from 'wagmi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';

// Helper for Type-Safe Translation
const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    const t = (key: string, params?: any) => (originalT as any)(key, params);
    return { t, locale };
};

export default function TermsPage() {
    const { t } = useSafeTranslation();
    const { address } = useAccount();
    const router = useRouter();
    const { signMessageAsync } = useSignMessage();
    
    const [hasRead, setHasRead] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    const handleSign = async () => {
        if (!address) {
            toast.error(t('dashboard.connect_wallet_title'));
            return;
        }
        if (!hasRead) return;
        
        setIsSigning(true);

        try {
            const timestamp = new Date().toISOString();
            // متن پیامی که کاربر در متامسک می‌بیند و امضا می‌کند
            const message = `I hereby accept the RayanChain Terms of Service & Privacy Policy.\n\nWallet: ${address}\nDate: ${timestamp}\n\nBy signing this message, I confirm that I have read and agreed to all terms.`;

            // 1. درخواست امضا از کیف پول
            const signature = await signMessageAsync({ message });

            // 2. ارسال به API
            const response = await fetch('/api/legal/accept-terms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address, 
                    signature, 
                    message, 
                    timestamp 
                }),
            });

            if (!response.ok) throw new Error('API Error');

            toast.success(t('terms_page.accepted_success'));
            
            // ذخیره در کلاینت برای جلوگیری از ریدایرکت مجدد
            localStorage.setItem('termsAccepted', 'true');
            
            // هدایت به داشبورد (یا انتخاب نقش اگر ندارد)
            router.push('/dashboard');

        } catch (error) {
            console.error("Signing Error:", error);
            toast.error(t('terms_page.sign_error'));
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <AppLayout>
            <div className="container max-w-4xl py-10">
                <Card className="border-primary/20 shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
                            <ShieldCheck className="w-10 h-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-headline">{t('terms_page.title')}</CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                        <Alert className="mb-6 bg-muted/50 border-primary/20">
                            <FileSignature className="h-4 w-4 text-primary" />
                            <AlertTitle>{t('terms_page.legal_binding_title')}</AlertTitle>
                            <AlertDescription>{t('terms_page.legal_binding_desc')}</AlertDescription>
                        </Alert>
                        
                        <ScrollArea className="h-[400px] w-full rounded-md border bg-card/50">
                            <div dir="auto" className="p-6 text-sm leading-relaxed text-muted-foreground text-justify">
                            
                            <h3 className="text-foreground font-bold text-lg mb-2 mt-0">1. {t('terms_page.section_1_title')}</h3>
                            <p className="mb-6">{t('terms_page.section_1_text')}</p>
                            
                            <h3 className="text-foreground font-bold text-lg mb-2">2. {t('terms_page.section_2_title')}</h3>
                            <p className="mb-6">{t('terms_page.section_2_text')}</p>
                            
                            <h3 className="text-foreground font-bold text-lg mb-2">3. {t('terms_page.section_3_title')}</h3>
                            <p className="mb-6">{t('terms_page.section_3_text')}</p>
                            
                            <h3 className="text-foreground font-bold text-lg mb-2">4. {t('terms_page.section_4_title')}</h3>
                            <p className="mb-6">{t('terms_page.section_4_text')}</p>

                            <h3 className="text-foreground font-bold text-lg mb-2">5. {t('terms_page.section_5_title')}</h3>
                            <p className="mb-2">{t('terms_page.section_5_text')}</p>

                            </div>
                        </ScrollArea>

                        <div className="flex items-center space-x-2 mt-6 p-4 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                            <Checkbox 
                                id="terms" 
                                checked={hasRead} 
                                onCheckedChange={(c) => setHasRead(c as boolean)} 
                                className="mr-2"
                            />
                            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none">
                                {t('terms_page.accept_checkbox')}
                            </label>
                        </div>
                    </CardContent>

                    <CardFooter className="pt-2">
                        <Button 
                            className="w-full h-12 text-lg" 
                            onClick={handleSign} 
                            disabled={!hasRead || isSigning || !address}
                        >
                            {isSigning ? <DaoLoadingSpinner className="mr-2" /> : <FileSignature className="mr-2 w-5 h-5 rtl:ml-2 rtl:mr-0" />}
                            {t('terms_page.sign_and_continue')}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}