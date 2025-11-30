// src/app/setup/page.tsx - FINAL FIX FOR SETUP DETECTION

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Rocket, CheckCircle, AlertTriangle } from 'lucide-react';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useWeb3 } from '@/context/Web3Provider';
import { useRouter } from 'next/navigation';
import { DeploymentLog } from '@/components/setup/deployment-log'; 
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SetupPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { userRole } = useWeb3();
    const { address } = useAccount();

    // وضعیت استقرار (Is Configured?)
    const [isSetupCompleted, setIsSetupCompleted] = useState<boolean | null>(null); // null means loading

    // ✅✅✅ FIX: بررسی وضعیت واقعی از API (نه از حافظه کش شده) ✅✅✅
    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                const res = await fetch('/api/setup/status', { cache: 'no-store' });
                const data = await res.json();
                
                if (data.isConfigured) {
                    setIsSetupCompleted(true);
                    
                    // اگر تنظیمات انجام شده، هدایت کن
                    // (یک تاخیر کوچک برای جلوگیری از پرش سریع)
                    setTimeout(() => {
                        if (!userRole) router.push('/role-selection');
                        else router.push('/dashboard');
                    }, 1000);
                } else {
                    setIsSetupCompleted(false);
                }
            } catch (e) {
                console.error("Failed to check setup status:", e);
                setIsSetupCompleted(false);
            }
        };
        checkSetupStatus();
    }, [userRole, router]);

    const handleResetSetup = async () => {
        if (!window.confirm(t('setup_page.logs.reset_confirm'))) return;
        try {
            toast.loading(t('setup_page.logs.resetting_in_progress'));
            const response = await fetch('/api/setup/reset', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to reset setup on server');
            
            toast.success(t('setup_page.logs.reset_success'));
            setIsSetupCompleted(false); // بلافاصله وضعیت UI را آپدیت کن
            // برای اطمینان از پاک شدن کامل، رفرش هم می‌کنیم
            setTimeout(() => window.location.reload(), 1000);
            
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const [rpcUrl, setRpcUrl] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [adminWallet, setAdminWallet] = useState('');
    
    useEffect(() => {
        if (address) setAdminWallet(address);
    }, [address]);

    const [isSaving, setIsSaving] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [logs, setLogs] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSaveConfig = async () => {
        setIsSaving(true);
        setError(null);
        setLogs(t('setup_page.logs.saving_config') + '\n');

        try {
            const response = await fetch('/api/setup/save-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rpcUrl, privateKey, adminAddress: adminWallet }),
            });
            const result = await response.json();
            if (result.success) {
                setLogs(prev => prev + t('setup_page.logs.save_success') + '\n');
                setSuccessMessage(result.message);
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            const errorMessage = (e as Error).message;
            setLogs(prev => prev + `${t('setup_page.logs.save_failed')}: ${errorMessage}\n`);
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeploy = async () => {
        setIsDeploying(true);
        setError(null);
        setSuccessMessage(null);
        setLogs(t('setup_page.logs.deploy_start') + '\n\n');

        try {
            const response = await fetch('/api/setup/deploy', { method: 'POST' });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || `Server error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Failed to get response reader.");

            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.type === 'log') {
                                setLogs(prev => prev + data.data);
                            } else if (data.type === 'success') {
                                setLogs(prev => prev + '\n' + t('setup_page.logs.deploy_success'));
                                setSuccessMessage(t('setup_page.deploy_success_message'));
                                // ✅ به محض موفقیت، وضعیت را آپدیت می‌کنیم
                                setIsSetupCompleted(true);
                                toast.success(t('setup_page.deploy_success_message'));
                                // رفرش برای اعمال تغییرات .env در کل برنامه
                                setTimeout(() => window.location.reload(), 3000);
                            } else if (data.type === 'error') {
                                throw new Error(data.data.message || t('setup_page.deploy_failed_message'));
                            }
                        } catch (parseError) {
                            setLogs(prev => prev + line);
                        }
                    } else if (line.trim()) {
                        setLogs(prev => prev + line + '\n');
                    }
                }
            }
        } catch (e) {
            const errorMessage = (e as Error).message;
            setLogs(prev => prev + '\n' + errorMessage);
            setError(errorMessage);
        } finally {
            setIsDeploying(false);
        }
    };

    // اگر وضعیت هنوز مشخص نشده (Null)، لودینگ نشان بده
    if (isSetupCompleted === null) {
        return <div className="flex h-screen items-center justify-center"><DaoLoadingSpinner className="w-10 h-10" /></div>;
    }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-background">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold font-headline text-gradient mb-2">{t('setup_page.title')}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">{t('setup_page.subtitle')}</p>
      </header>

      {/* ====== ALERT: SETUP COMPLETED ====== */}
      {isSetupCompleted && (
        <Alert className="max-w-3xl mx-auto mb-10 border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-500">{t('setup_page.logs.already_setup_title')}</AlertTitle>
          <AlertDescription>
            {t('setup_page.logs.already_setup_desc')}
            <div className="flex gap-4 mt-4">
                <Button variant="default" className="w-full bg-green-600 hover:bg-green-700" onClick={() => router.push('/dashboard')}>
                    {t('setup_page.go_to_dashboard')}
                </Button>
                <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive/10" onClick={handleResetSetup}>
                    {t('setup_page.logs.reset_setup_button')}
                </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ====== MAIN FORM (Disabled if setup completed) ====== */}
      <div className={cn("grid gap-10 lg:grid-cols-2 max-w-6xl mx-auto w-full", isSetupCompleted && "opacity-50 pointer-events-none filter blur-sm")}>
        
        {/* Left Column: Forms */}
        <div className="space-y-10">
          <Card>
            <CardHeader><CardTitle>{t('setup_page.step1_title')}</CardTitle><CardDescription>{t('setup_page.step1_desc')}</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label>{t('setup_page.rpc_url_label')}</Label><Input value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)} disabled={isSaving || isDeploying} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>{t('setup_page.private_key_label')}</Label><Input type="password" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} disabled={isSaving || isDeploying} placeholder="0x..." /></div>
              <div className="space-y-2"><Label>{t('setup_page.admin_wallet_label')}</Label><Input value={adminWallet} onChange={(e) => setAdminWallet(e.target.value)} disabled={isSaving || isDeploying} placeholder="0x..." /></div>
              <Button onClick={handleSaveConfig} disabled={isSaving || isDeploying || !rpcUrl || !privateKey || !adminWallet} className="w-full">{isSaving ? <DaoLoadingSpinner /> : <CheckCircle className="mr-2" />}{t('setup_page.save_config_button')}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('setup_page.step2_title')}</CardTitle><CardDescription>{t('setup_page.step2_desc')}</CardDescription></CardHeader>
            <CardContent>
              <Button onClick={handleDeploy} disabled={isDeploying || isSaving} className="w-full">{isDeploying ? <DaoLoadingSpinner /> : <Rocket className="mr-2" />}{t('setup_page.deploy_button')}</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Logs */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader><CardTitle className="flex items-center gap-2"><Terminal /> {t('setup_page.logs_title')}</CardTitle><CardDescription>{t('setup_page.logs_desc')}</CardDescription></CardHeader>
          <CardContent className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto font-mono text-xs">
            <DeploymentLog logs={logs} />
            {error && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('profile_page.error_title')}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}