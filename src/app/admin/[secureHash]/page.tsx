// src/app/admin/[secureHash]/page.tsx - FINAL I18N

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldCheck, Settings } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Provider';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useTranslation } from '@/hooks/use-translation'; // ✅ ایمپورت هوک ترجمه

const EXPECTED_HASH = process.env.NEXT_PUBLIC_ADMIN_HASH || "RayanSecureAdmin_998877_XyZ";

export default function AdminDashboard() {
    const { t } = useTranslation(); // ✅ استفاده از هوک
    const params = useParams();
    const router = useRouter();
    const { userRole, isHydrated } = useWeb3();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const urlHash = Array.isArray(params.secureHash) ? params.secureHash[0] : params.secureHash;
        
        if (urlHash !== EXPECTED_HASH) {
            console.error("❌ Hash Mismatch!");
            router.push('/404'); 
            return;
        }
        
        // Uncomment for production security:
        // if (isHydrated && userRole !== 'admin') {
        //     router.push('/dashboard');
        //     return;
        // }

        setIsAuthorized(true);
    }, [params.secureHash, userRole, isHydrated, router]);

    if (!isAuthorized) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4">
                <DaoLoadingSpinner />
                <p className="text-muted-foreground text-sm">{t('dashboard.admin.verifying')}</p>
            </div>
        );
    }

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8 text-gradient font-headline">{t('dashboard.admin.title')}</h1>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:border-primary cursor-pointer transition-all card-glow" onClick={() => router.push(`/admin/${EXPECTED_HASH}/settings`)}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg"><Settings className="w-8 h-8 text-primary" /></div>
                        <CardTitle>{t('dashboard.admin.settings_card_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{t('dashboard.admin.settings_card_desc')}</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary cursor-pointer transition-all card-glow" onClick={() => router.push(`/setup`)}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg"><ShieldCheck className="w-8 h-8 text-primary" /></div>
                        <CardTitle>{t('dashboard.admin.security_card_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{t('dashboard.admin.security_card_desc')}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}