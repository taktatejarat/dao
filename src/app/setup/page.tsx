"use client";

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
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

export default function SetupPage() {
    const { t } = useTranslation();
    // معماری جدید: فقط با آدرس رجیستری کار می‌کنیم
    const { setRegistryAddress, registryAddress, address } = useWeb3();
    const router = useRouter();

    // وضعیت استقرار بر اساس وجود آدرس رجیستری تعیین می‌شود
    const isSetupCompleted = !!registryAddress;

    const handleResetSetup = async () => {
        try {
            // API جدید برای ریست کردن سمت سرور
            const response = await fetch('/api/setup/reset', { method: 'POST' });
            
            if (!response.ok) {
                throw new Error('Failed to reset setup on server');
            }
            
            if (typeof window !== 'undefined') {
                localStorage.removeItem('registryAddress');
            }
            setRegistryAddress(undefined);
            
            // صفحه را رفرش می‌کنیم تا مقادیر از حافظه پاک شوند
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (error) {
            console.error("Failed to reset setup:", error);
            alert("Failed to reset setup."); // Fallback alert
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
                                
                // تنها آدرس رجیستری را ذخیره می‌کنیم
                if (typeof window !== 'undefined') {
                    localStorage.setItem('registryAddress', deployedRegistryAddress);
                }
                setRegistryAddress(deployedRegistryAddress);
                
                // تاخیر کوتاه برای نمایش پیام موفقیت قبل از انتقال
                setTimeout(() => {
                    router.push('/dashboard');
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
    
    // در این نسخه، ما یک API Route برای `/api/setup` نداریم،
    // بلکه APIهای مجزا برای هر عمل داریم.
    // اگر می‌خواهید همچنان از یک API استفاده کنید، باید منطق سمت سرور را تغییر دهید.
    // من فرض را بر استفاده از APIهای مجزا گذاشته‌ام.

    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">{t('setup_page.title')}</h1>
                <p className="text-muted-foreground">{t('setup_page.subtitle')}</p>
            </header>

            {isSetupCompleted && (
                <Alert className="mb-8">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('setup_page.logs.already_setup_title')}</AlertTitle>
                    <AlertDescription>
                        {t('setup_page.logs.already_setup_desc')}
                        <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleResetSetup}>
                            {t('setup_page.logs.reset_setup_button')}
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className={`grid gap-8 lg:grid-cols-2 ${isSetupCompleted ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('setup_page.step1_title')}</CardTitle>
                            <CardDescription>{t('setup_page.step1_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="private-key">{t('setup_page.private_key_label')}</Label>
                                <Input 
                                    id="private-key" 
                                    type="password"
                                    placeholder="0x..."
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                    disabled={isSaving || isDeploying}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admin-wallet">{t('setup_page.admin_wallet_label')}</Label>
                                <Input 
                                    id="admin-wallet"
                                    placeholder="0x..."
                                    value={adminWallet}
                                    onChange={(e) => setAdminWallet(e.target.value)}
                                    disabled={isSaving || isDeploying}
                                />
                            </div>
                            <Button type="button" onClick={handleSaveConfig} disabled={isSaving || isDeploying || !rpcUrl || !privateKey || !adminWallet}>
                                {isSaving ? <DaoLoadingSpinner /> : <CheckCircle />}
                                {t('setup_page.save_config_button')}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('setup_page.step2_title')}</CardTitle>
                            <CardDescription>{t('setup_page.step2_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button type="button" onClick={handleDeploy} disabled={isDeploying || isSaving}>
                                {isDeploying ? <DaoLoadingSpinner /> : <Rocket />}
                                {t('setup_page.deploy_button')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal /> {t('setup_page.logs_title')}
                        </CardTitle>
                        <CardDescription>{t('setup_page.logs_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                            {logs}
                        </pre>
                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('profile_page.error_title')}</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {successMessage && !isDeploying && (
                           <Alert variant="success" className="mt-4">
                               <CheckCircle className="h-4 w-4" />
                               <AlertTitle>{t('setup_page.success_title')}</AlertTitle>
                               <AlertDescription>
                                   {successMessage}
                                   <Button size="sm" className="mt-4 w-full" onClick={() => router.push('/dashboard')}>
                                      {t('setup_page.go_to_dashboard')}
                                   </Button>
                               </AlertDescription>
                           </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}