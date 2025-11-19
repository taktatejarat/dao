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
import { DeploymentLog } from '@/components/setup/deployment-log'; // ✅ NEW IMPORT
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SetupPage() {
    const { t } = useTranslation();
    const router = useRouter();
    // ✅ FIX: setUserRole را دریافت می‌کنیم، setRegistryAddress حذف شده است
    const { registryAddress, setUserRole, userRole } = useWeb3();
    const { isConnected, address } = useAccount();

    // وضعیت استقرار بر اساس وجود آدرس رجیستری تعیین می‌شود
    const isSetupCompleted = !!registryAddress;
    const handleResetSetup = async () => {
        if (!window.confirm(t('setup_page.logs.reset_confirm'))) {
            return; // اگر کاربر "Cancel" را بزند، هیچ کاری انجام نده
        }
        try {
            toast.loading(t('setup_page.logs.resetting_in_progress'));
            const response = await fetch('/api/setup/reset', { method: 'POST' });
            
            if (!response.ok) {
                throw new Error('Failed to reset setup on server');
            }            
            toast.success(t('setup_page.logs.reset_success'));
            setTimeout(() => window.location.reload(), 1500);
            
        } catch (error) {
            console.error("Failed to reset setup:", error);
            toast.error((error as Error).message);
        }
    };

    const [rpcUrl, setRpcUrl] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [adminWallet, setAdminWallet] = useState('');
    
    // وقتی کاربر کیف پول خود را متصل می‌کند، آدرس ادمین به صورت خودکار پر می‌شود
    useEffect(() => {
        if (address) {
            setAdminWallet(address);
        }
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
            // API جدید برای ذخیره پیکربندی
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
            // API جدید برای استقرار
            const response = await fetch('/api/setup/deploy', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || `Server error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Failed to get response reader.");
            }

            const decoder = new TextDecoder();
            let finalResult = '';

            // خواندن استریم لاگ‌ها
            let lastSuccessData = null;
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
                                lastSuccessData = data.data;
                                setLogs(prev => prev + '\n' + t('setup_page.logs.deploy_success'));
                                setSuccessMessage(t('setup_page.deploy_success_message').replace('{address}', data.data.addresses.daoAddress));
                            } else if (data.type === 'error') {
                                throw new Error(data.data.message || t('setup_page.deploy_failed_message'));
                            }
                        } catch (parseError) {
                            // اگر خط JSON نبود، آن را به عنوان متن معمولی نمایش دهیم
                            setLogs(prev => prev + line);
                        }
                    } else if (line.trim()) {
                        setLogs(prev => prev + line + '\n');
                    }
                }
            }

            // اگر استقرار موفق بود، آدرس رجیستری را ذخیره کنیم
            if (lastSuccessData && lastSuccessData.addresses) {
                
                const deployedRegistryAddress = lastSuccessData.addresses.registryAddress;
                console.log("SetupPage: Received Registry Address from API:", deployedRegistryAddress);
                                
                toast.success(t('setup_page.deploy_success_message'));
                setTimeout(() => {
                    // رفرش کردن صفحه باعث می‌شود Web3Provider با .env جدید مقداردهی شود
                    // و سپس به طور خودکار به داشبورد هدایت شود
                    window.location.reload();
                }, 3000);
            } else {
                throw new Error(t('setup_page.deploy_failed_message'));
            }

        } catch (e) {
            const errorMessage = (e as Error).message;
            setLogs(prev => prev + '\n' + errorMessage);
            setError(errorMessage);
        } finally {
            setIsDeploying(false);
        }
    };
    
    useEffect(() => {
        if (isSetupCompleted && !userRole) {
            router.push('/role-selection'); // یا هر صفحه‌ای که برای انتخاب نقش دارید
        }
    }, [isSetupCompleted, userRole, router]);

  return (
    <div className="min-h-screen flex flex-col p-6 bg-background">

      {/* ====== PAGE HEADER ====== */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold font-headline text-gradient mb-2">
          {t('setup_page.title')}
        </h1>

        <p className="text-muted-foreground max-w-xl mx-auto">
          {t('setup_page.subtitle')}
        </p>
      </header>


      {/* ====== GLOBAL STATUS AREA ====== */}
      {isSetupCompleted && (
        <Alert className="max-w-3xl mx-auto mb-10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('setup_page.logs.already_setup_title')}</AlertTitle>
          <AlertDescription>
            {t('setup_page.logs.already_setup_desc')}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={handleResetSetup}
            >
              {t('setup_page.logs.reset_setup_button')}
            </Button>
          </AlertDescription>
        </Alert>
      )}


      {/* ====== MAIN GRID ====== */}
      <div
        className={cn(
          "grid gap-10 lg:grid-cols-2 max-w-6xl mx-auto w-full",
          isSetupCompleted && "opacity-50 pointer-events-none"
        )}
      >

        {/* ====== LEFT COLUMN ====== */}
        <div className="space-y-10">

          {/* --- Step 1: Configuration --- */}
          <Card>
            <CardHeader>
              <CardTitle>{t('setup_page.step1_title')}</CardTitle>
              <CardDescription>
                {t('setup_page.step1_desc')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* RPC URL */}
              <div className="space-y-2">
                <Label htmlFor="rpc-url">{t('setup_page.rpc_url_label')}</Label>
                <Input
                  id="rpc-url"
                  placeholder="https://polygon-amoy.infura.io/v3/..."
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  disabled={isSaving || isDeploying}
                />
              </div>

              {/* PRIVATE KEY */}
              <div className="space-y-2">
                <Label htmlFor="private-key">
                  {t('setup_page.private_key_label')}
                </Label>
                <Input
                  id="private-key"
                  type="password"
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  disabled={isSaving || isDeploying}
                />
              </div>

              {/* ADMIN WALLET */}
              <div className="space-y-2">
                <Label htmlFor="admin-wallet">
                  {t('setup_page.admin_wallet_label')}
                </Label>
                <Input
                  id="admin-wallet"
                  placeholder="0x..."
                  value={adminWallet}
                  onChange={(e) => setAdminWallet(e.target.value)}
                  disabled={isSaving || isDeploying}
                />
              </div>

              {/* SAVE CONFIG */}
              <Button
                type="button"
                onClick={handleSaveConfig}
                disabled={
                  isSaving ||
                  isDeploying ||
                  !rpcUrl ||
                  !privateKey ||
                  !adminWallet
                }
                className="w-full"
              >
                {isSaving ? <DaoLoadingSpinner /> : <CheckCircle />}
                <span className="ml-2">
                  {t('setup_page.save_config_button')}
                </span>
              </Button>
            </CardContent>
          </Card>


          {/* --- Step 2: Deployment --- */}
          <Card>
            <CardHeader>
              <CardTitle>{t('setup_page.step2_title')}</CardTitle>
              <CardDescription>
                {t('setup_page.step2_desc')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button
                type="button"
                onClick={handleDeploy}
                disabled={isDeploying || isSaving}
                className="w-full"
              >
                {isDeploying ? <DaoLoadingSpinner /> : <Rocket />}
                <span className="ml-2">
                  {t('setup_page.deploy_button')}
                </span>
              </Button>
            </CardContent>
          </Card>

        </div>


        {/* ====== RIGHT COLUMN ====== */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal /> {t('setup_page.logs_title')}
            </CardTitle>
            <CardDescription>
              {t('setup_page.logs_desc')}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto">

            {/* LOGS */}
            <pre className="text-xs whitespace-pre-wrap font-mono">
              <DeploymentLog logs={logs} />
            </pre>

            {/* ERROR */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('profile_page.error_title')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* SUCCESS */}
            {successMessage && !isDeploying && (
              <Alert variant="success" className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>{t('setup_page.success_title')}</AlertTitle>
                <AlertDescription>
                  {successMessage}
                  <Button
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => router.push('/dashboard')}
                  >
                    {t('setup_page.go_to_dashboard')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}