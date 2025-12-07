// src/app/admin/[secureHash]/page.tsx - FINAL ENTERPRISE ADMIN HUB

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ShieldCheck, Settings, AlertTriangle, Users, 
    Activity, Lock, Server, ArrowRight, Bug, 
    Power, CheckCircle2, XCircle 
} from 'lucide-react';
import { useWeb3 } from '@/context/Web3Provider';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useTranslation } from '@/hooks/use-translation';
import { useSignMessage, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';

const EXPECTED_HASH = process.env.NEXT_PUBLIC_ADMIN_HASH || "RayanSecureAdmin_998877_XyZ";

export default function AdminSecureHub() {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const { userRole, isHydrated, address, daoAddress } = useWeb3();
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    // استفاده از هوک ادمین برای خواندن وضعیت سیستم
    const { stats, isLoading: isStatsLoading, refetch } = useAdminDashboard();
    
    // استیت‌های امضای دوم (برای Setup)
    const { signMessageAsync } = useSignMessage();
    const [isVerifying, setIsVerifying] = useState(false);

    // استیت نوشتن قرارداد (برای Pause/Unpause)
    const { writeContractAsync, isPending: isTxPending } = useWriteContract();

    useEffect(() => {
        const urlHash = Array.isArray(params.secureHash) ? params.secureHash[0] : params.secureHash;
        if (urlHash !== EXPECTED_HASH) {
            console.error("❌ Hash Mismatch!");
            router.push('/404'); 
            return;
        }
        setIsAuthorized(true);
    }, [params.secureHash, userRole, isHydrated, router]);

    // --- 1. تابع تغییر وضعیت سیستم (Emergency Pause) ---
    const toggleSystemPause = async (shouldPause: boolean) => {
        if (!daoAddress) return;
        try {
            const action = shouldPause ? 'pause' : 'unpause';
            const toastId = toast.loading(t(`dashboard.admin.${action}_processing`));

            await writeContractAsync({
                address: daoAddress,
                abi: rayanChainDaoAbi,
                functionName: action, // تابع pause() یا unpause()
            });

            toast.success(t(`dashboard.admin.${action}_success`), { id: toastId });
            refetch(); // آپدیت وضعیت
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'), { description: (error as Error).message });
        }
    };

    // --- 2. تابع دسترسی حساس (Setup) ---
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

    if (!isAuthorized || isStatsLoading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4">
                <DaoLoadingSpinner />
                <p className="text-muted-foreground text-sm animate-pulse">{t('dashboard.admin.verifying')}</p>
            </div>
        );
    }

    const isSystemPaused = stats?.isPaused || false;

    return (
        <div className="container py-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono">
                            <Lock className="w-3 h-3 mr-1" />
                            {t('dashboard.admin.secure_session')}: {address?.slice(0, 6)}...{address?.slice(-4)}
                        </Badge>
                    </div>
                    <h1 className="text-4xl font-bold font-headline text-gradient">{t('dashboard.admin.hub_title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('dashboard.admin.hub_subtitle')}</p>
                </div>
            </div>

            {/* --- SECTION 1: SYSTEM HEALTH & CONTROL (Full Width) --- */}
            <Card className={`border-l-4 shadow-lg transition-colors ${isSystemPaused ? 'border-l-red-500 bg-red-500/5' : 'border-l-emerald-500 bg-emerald-500/5'}`}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Activity className={`w-6 h-6 ${isSystemPaused ? 'text-red-500' : 'text-emerald-500'}`} />
                            {t('dashboard.system_status')}
                        </CardTitle>
                        <Badge variant={isSystemPaused ? "destructive" : "success"} className="text-base px-4 py-1">
                            {isSystemPaused ? t('dashboard.status_paused') : t('dashboard.status_active')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-muted-foreground leading-relaxed">
                            {isSystemPaused 
                                ? t('dashboard.system_paused_desc') 
                                : t('dashboard.admin.system_active_desc')
                            }
                        </p>
                        
                        <div className="flex items-center gap-4 bg-background/50 p-3 rounded-xl border shadow-sm">
                            <span className="text-sm font-medium">{t('dashboard.admin.emergency_switch')}</span>
                            <Switch 
                                checked={!isSystemPaused} 
                                onCheckedChange={(checked) => toggleSystemPause(!checked)} // اگر چک باشد یعنی فعال است (پاوز نیست)
                                disabled={isTxPending}
                            />
                            {isTxPending && <DaoLoadingSpinner className="w-4 h-4" />}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- SECTION 2: MANAGEMENT GRID (3 Columns) --- */}
            <div className="grid gap-6 md:grid-cols-3">
                
                {/* A. Settings */}
                <Card className="group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer" onClick={() => router.push(`/admin/${EXPECTED_HASH}/settings`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Settings className="w-6 h-6" />
                            </div>
                            {t('dashboard.admin.settings_card_title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{t('dashboard.admin.settings_card_desc')}</p>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t('dashboard.admin.manage')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </span>
                    </CardFooter>
                </Card>

                {/* B. User Management */}
                <Card className="group hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/users')}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Users className="w-6 h-6" />
                            </div>
                            {t('dashboard.user_management')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{t('dashboard.user_management_desc')}</p>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <span className="text-xs font-medium text-blue-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t('dashboard.admin.manage')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </span>
                    </CardFooter>
                </Card>

                {/* C. Debugger */}
                <Card className="group hover:border-orange-500/50 hover:shadow-md transition-all cursor-pointer" onClick={() => router.push(`/admin/${EXPECTED_HASH}/debug`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <Bug className="w-6 h-6" />
                            </div>
                            {t('page_titles.contract_analyzer')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{t('dashboard.admin.debugger_desc')}</p>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <span className="text-xs font-medium text-orange-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t('dashboard.admin.inspect')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </span>
                    </CardFooter>
                </Card>
            </div>

            {/* --- SECTION 3: DANGER ZONE (Split Layout) --- */}
            <div className="grid md:grid-cols-2 gap-6">
                
                {/* Logs (Moved here for better access) */}
                <Card className="hover:bg-muted/20 transition-colors cursor-pointer border-dashed" onClick={() => router.push('/logs')}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 rounded-full bg-purple-500/10 text-purple-500">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{t('logs_page.title')}</h3>
                            <p className="text-sm text-muted-foreground">{t('logs_page.subtitle')}</p>
                        </div>
                        <ArrowRight className="ml-auto w-5 h-5 text-muted-foreground rtl:rotate-180" />
                    </CardContent>
                </Card>

                {/* Infrastructure Reset */}
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <h3 className="font-bold text-destructive flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5" />
                                {t('dashboard.admin.security_card_title')}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('dashboard.admin.security_card_desc')}
                            </p>
                        </div>
                        <Button 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => handleCriticalAccess('/setup')}
                            disabled={isVerifying}
                        >
                            {isVerifying ? <DaoLoadingSpinner className="mr-2 h-4 w-4" /> : <Server className="mr-2 h-4 w-4" />}
                            {isVerifying ? t('dashboard.verifying_identity') : t('dashboard.admin.access_setup')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}