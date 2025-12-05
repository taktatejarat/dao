// src/app/admin/[secureHash]/page.tsx - REDESIGNED ENTERPRISE VERSION

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ShieldCheck, 
    Settings, 
    AlertTriangle, 
    Users, 
    Activity, 
    Lock, 
    Server,
    ArrowRight,
    Bug
} from 'lucide-react';
import { useWeb3 } from '@/context/Web3Provider';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useTranslation } from '@/hooks/use-translation';
import { useSignMessage } from 'wagmi';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const EXPECTED_HASH = process.env.NEXT_PUBLIC_ADMIN_HASH || "RayanSecureAdmin_998877_XyZ";

export default function AdminSecureHub() {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const { userRole, isHydrated, address } = useWeb3();
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    // استیت‌های امضای دوم (برای Setup)
    const { signMessageAsync } = useSignMessage();
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        const urlHash = Array.isArray(params.secureHash) ? params.secureHash[0] : params.secureHash;
        
        if (urlHash !== EXPECTED_HASH) {
            console.error("❌ Hash Mismatch!");
            router.push('/404'); 
            return;
        }
        setIsAuthorized(true);
    }, [params.secureHash, userRole, isHydrated, router]);

    // تابع امنیتی لایه دوم (فقط برای Setup)
    const handleCriticalAccess = async (targetPath: string) => {
        try {
            setIsVerifying(true);
            const timestamp = new Date().toLocaleString();
            const message = `${t('dashboard.admin.critical_access_warning')}\n\nTarget: ${targetPath}\nTime: ${timestamp}\nAction: INFRASTRUCTURE RESET`;
            
            await signMessageAsync({ message });
            
            toast.success(t('dashboard.access_granted'));
            router.push(targetPath);
        } catch (error) {
            toast.error(t('dashboard.access_denied'));
        } finally {
            setIsVerifying(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4">
                <DaoLoadingSpinner />
                <p className="text-muted-foreground text-sm animate-pulse">{t('dashboard.admin.verifying')}</p>
            </div>
        );
    }

    return (
        <div className="container py-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10 px-3 py-1">
                            <Lock className="w-3 h-3 mr-1" />
                            {t('dashboard.admin.secure_session_active')}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                            {address?.slice(0, 8)}...{address?.slice(-6)}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('dashboard.admin.hub_title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('dashboard.admin.hub_subtitle')}</p>
                </div>
            </div>

            {/* Operational Zone */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
                {/* 1. General Settings */}
                <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer relative overflow-hidden" onClick={() => router.push(`/admin/${EXPECTED_HASH}/settings`)}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Settings className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Settings className="w-6 h-6 text-primary" />
                            </div>
                            {t('dashboard.admin.settings_card_title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('dashboard.admin.settings_card_desc')}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full justify-between group-hover:text-primary">
                            {t('dashboard.admin.manage')} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>
                {/* 4. Registry Debugger (NEW) */}
                <Card 
                    className="group hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5 cursor-pointer relative overflow-hidden" 
                    onClick={() => router.push(`/admin/${EXPECTED_HASH}/debug`)}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Bug className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                                <Bug className="w-6 h-6 text-orange-500" />
                            </div>
                            {t('page_titles.contract_debugger')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('dashboard.admin.debugger_desc')}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full justify-between group-hover:text-orange-500">
                            {t('dashboard.admin.inspect')} <ArrowRight className="w-4 h-4 ml-2 rtl:rotate-180" />
                        </Button>
                    </CardFooter>
                </Card>
                {/* 2. User Management (Placeholder for Future) */}
                <Card className="group hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer relative overflow-hidden" onClick={() => router.push('/admin/users')}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            {t('dashboard.user_management')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('dashboard.user_management_desc')}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full justify-between group-hover:text-blue-500">
                            {t('dashboard.admin.manage')} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* 3. System Logs (Direct Link) */}
                <Card className="group hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer relative overflow-hidden" onClick={() => router.push('/logs')}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                <Activity className="w-6 h-6 text-purple-500" />
                            </div>
                            {t('logs_page.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('logs_page.subtitle')}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full justify-between group-hover:text-purple-500">
                            {t('dashboard.view_all')} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Separator className="my-8" />

            {/* Danger Zone */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                    <h2 className="text-xl font-bold text-destructive">{t('dashboard.admin.danger_zone')}</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Infrastructure Reset */}
                    <div className="flex flex-col justify-between p-4 bg-background/50 rounded-lg border border-destructive/10">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Server className="w-4 h-4 text-muted-foreground" />
                                {t('dashboard.admin.security_card_title')}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('dashboard.admin.security_card_desc')}
                            </p>
                        </div>
                        <Button 
                            variant="destructive" 
                            className="w-full sm:w-auto self-start"
                            onClick={() => handleCriticalAccess('/setup')}
                            disabled={isVerifying}
                        >
                            {isVerifying ? <DaoLoadingSpinner className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            {isVerifying ? t('dashboard.verifying_identity') : t('dashboard.admin.access_setup')}
                        </Button>
                    </div>

                    {/* Emergency Pause (Future Feature) */}
                    <div className="flex flex-col justify-between p-4 bg-background/50 rounded-lg border border-destructive/10 opacity-75">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                {t('dashboard.system_status')}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('dashboard.system_paused_desc')}
                            </p>
                        </div>
                        <Button variant="outline" disabled className="w-full sm:w-auto self-start">
                            {t('common.comming_soon')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}