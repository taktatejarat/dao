// src/components/dashboard/dashboard-page-content.tsx

"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/context/Web3Provider";
import { useTranslation } from "@/hooks/use-translation";
import { formatEther } from "viem";
import { formatNumber } from "@/lib/utils";
import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";
import Link from "next/link";
import { useSignMessage } from 'wagmi';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";

// Components
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { InvestmentChart } from "@/components/dashboard/investment-chart";
import { ProposalsList } from "@/components/dashboard/proposals-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // ✅ اضافه شدن تب‌ها

// Icons
import { Wallet, Banknote, Award, Zap, TrendingUp, Layers, FilePlus, Users, Crown, Shield, PieChart, UserCheck } from "lucide-react";

// Specialized Hooks
import { useInvestorDashboard } from "@/hooks/useInvestorDashboard";
import { useStartupDashboard } from "@/hooks/useStartupDashboard";
import { useDelegateDashboard } from "@/hooks/useDelegateDashboard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

export function DashboardPageContent() {
    const { userRole, isHydrated } = useWeb3();
    const { t, locale } = useTranslation();
    
    // فراخوانی هوک‌ها
    // نکته: React Query به صورت خودکار درخواست‌های تکراری را کش می‌کند، پس فراخوانی همزمان مشکلی ندارد
    const investorData = useInvestorDashboard();
    const startupData = useStartupDashboard();
    const delegateData = useDelegateDashboard();
    const adminData = useAdminDashboard();
    // تشخیص خودکار قابلیت نماینده بودن
    // اگر کاربر قدرت رای وکالتی (receivedDelegation) داشته باشد، یعنی نماینده هم هست
    const hasDelegatedPower = delegateData.stats && delegateData.stats.receivedDelegation > 0n;

    const formatVal = (val: bigint) => formatNumber(formatEther(val), locale);

    // --- 1. INVESTOR VIEW ---
    const InvestorView = () => {
        const { stats, isLoading } = investorData;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title={t('dashboard.wallet_balance')} value={`${stats ? formatVal(stats.walletBalance) : '0'} RYC`} icon={Wallet} description={t('dashboard.available_to_stake')} isLoading={isLoading} />
                    <StatCard title={t('dashboard.staked_amount')} value={`${stats ? formatVal(stats.stakedAmount) : '0'} RYC`} icon={Layers} description={t('dashboard.earning_rewards')} variant="default" isLoading={isLoading} />
                    <StatCard title={t('dashboard.claimable_rewards')} value={`${stats ? formatVal(stats.claimableRewards) : '0'} RYC`} icon={TrendingUp} description={t('dashboard.unclaimed_profit')} variant="positive" isLoading={isLoading} />
                    <StatCard title={t('dashboard.voting_power')} value={stats ? formatNumber(formatEther(stats.votingPower), locale) : '0'} icon={Zap} description={`${t('dashboard.participation_score')}: ${stats?.participationScore.toString()}`} isLoading={isLoading} />
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2"><InvestmentChart /></div>
                    <div><ActivityFeed /></div>
                </div>
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">{t('dashboard.active_opportunities')}</h2>
                    <ProposalsList limit={3} />
                </div>
            </div>
        );
    };

    // --- 2. STARTUP VIEW ---
    const StartupView = () => {
        const { stats, isLoading } = startupData;
        if (isLoading) return <div className="flex justify-center p-12"><DaoLoadingSpinner /></div>;
        
        if (!stats || stats.totalProposals === 0) {
            return (
                <div className="text-center py-16 border-2 border-dashed rounded-xl animate-in zoom-in duration-300">
                    <FilePlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">{t('dashboard.start_journey')}</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('dashboard.start_journey_desc')}</p>
                    <Button size="lg" asChild><Link href="/proposals/new">{t('dashboard.create_first_proposal')}</Link></Button>
                </div>
            );
        }
        
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <StatCard title={t('dashboard.total_projects')} value={stats.totalProposals.toString()} icon={Layers} description={t('dashboard.all_time')} isLoading={isLoading} />
                     <StatCard title={t('dashboard.active_projects')} value={stats.activeProposals.toString()} icon={Zap} description={t('dashboard.currently_voting_funding')} variant="neutral" isLoading={isLoading} />
                     <StatCard title={t('dashboard.successful_funded')} value={stats.successfulProjects.toString()} icon={Award} description={t('dashboard.fully_funded')} variant="positive" isLoading={isLoading} />
                </div>
                <div className="mt-8">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">{t('dashboard.my_proposals')}</h2>
                        <Button variant="outline" asChild><Link href="/proposals/new">{t('dashboard.new_proposal')}</Link></Button>
                     </div>
                     <ProposalsList limit={5} /> 
                </div>
            </div>
        );
    };

    // --- 3. DELEGATE VIEW ---
    const DelegateView = () => {
        const { stats, isLoading } = delegateData;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title={t('dashboard.total_governance_power')} value={stats ? formatVal(stats.totalVotingPower) : '0'} icon={Crown} description={t('dashboard.combined_power')} variant="default" isLoading={isLoading} />
                    <StatCard title={t('dashboard.delegated_to_me')} value={stats ? formatVal(stats.receivedDelegation) : '0'} icon={Users} description={`${t('dashboard.trust_percentage')}: ${stats?.delegationPercentage}%`} variant="neutral" isLoading={isLoading} />
                    <StatCard title={t('dashboard.my_skin_in_game')} value={`${stats ? formatVal(stats.selfStaked) : '0'} RYC`} icon={Shield} description={t('dashboard.personal_stake')} isLoading={isLoading} />
                    <StatCard title={t('dashboard.reputation_score')} value={stats?.participationScore.toString() ?? '0'} icon={Award} description={t('dashboard.activity_based_rank')} isLoading={isLoading} />
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">{t('dashboard.proposals_awaiting_vote')}</h2>
                            <Button variant="ghost" size="sm" asChild><Link href="/proposals">{t('dashboard.view_all_proposals')}</Link></Button>
                        </div>
                        <ProposalsList limit={5} />
                    </div>
                    <div><ActivityFeed /></div>
                </div>
            </div>
        );
    };

    // --- 4. ADMIN VIEW (With Biometric-like Security) ---
    const AdminView = () => {
        const { stats, isLoading } = adminData;
        const router = useRouter();
        const { signMessageAsync } = useSignMessage();
        const [isVerifying, setIsVerifying] = useState(false);
        // دریافت هش از env
        const secureHash = process.env.NEXT_PUBLIC_ADMIN_HASH;

        const handleSecureAccess = async () => {
            if (!secureHash) {
                toast.error(t('dashboard.security_config_error'));
                return;
            }

            try {
                setIsVerifying(true);
                
                // ۱. پیام امنیتی برای امضا (شامل زمان برای جلوگیری از استفاده مجدد)
                const timestamp = new Date().toLocaleString();
                const message = `${t('dashboard.security_access_request')}\n\nTime: ${timestamp}\nAdmin: ${stats?.owner}`;

                // ۲. درخواست امضا از کیف پول
                await signMessageAsync({ message });

                // ۳. اگر امضا موفق بود (ارور نداد)، هدایت کن
                toast.success(t('dashboard.access_granted'));
                router.push(`/admin/${secureHash}/`);

            } catch (error) {
                // اگر کاربر در کیف پول "Reject" را زد یا مشکلی پیش آمد
                console.error("Signature denied:", error);
                toast.error(t('dashboard.access_denied'));
            } finally {
                setIsVerifying(false);
            }
        };

        return (
            <div className="space-y-6">
                {/* هشدارهای سیستمی */}
                {stats?.isPaused && (
                    <Alert variant="destructive" className="animate-pulse">
                        <Shield className="h-4 w-4" />
                        <AlertTitle>{t('dashboard.system_paused_title')}</AlertTitle>
                        <AlertDescription>{t('dashboard.system_paused_desc')}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title={t('dashboard.treasury_balance')} 
                        value={`${stats ? formatVal(stats.treasuryBalance) : '0'} RYC`} 
                        icon={Banknote} 
                        description={t('dashboard.available_funds')}
                        variant="default" 
                        isLoading={isLoading}
                    />
                    <StatCard 
                        title={t('dashboard.total_proposals_title')} 
                        value={stats?.totalProposals.toString() ?? '0'} 
                        icon={Layers} 
                        description={t('dashboard.all_time_stats')}
                        isLoading={isLoading}
                    />
                    <StatCard 
                        title={t('dashboard.contract_owner')} 
                        value={stats ? `${stats.owner.substring(0, 6)}...` : '...'} 
                        icon={Crown} 
                        description={t('dashboard.current_admin')}
                        variant="neutral"
                        isLoading={isLoading}
                    />
                    <StatCard 
                        title={t('dashboard.system_status')} 
                        value={stats?.isPaused ? t('dashboard.status_paused') : t('dashboard.status_active')} 
                        icon={Shield} 
                        description={t('dashboard.operational_status')}
                        variant={stats?.isPaused ? "negative" : "positive"}
                        isLoading={isLoading}
                    />
                </div>

                {/* بخش دسترسی سریع با لایه امنیتی اضافی */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-6 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <LockKeyhole className="h-5 w-5 text-primary" />
                            {t('dashboard.security_settings')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('dashboard.security_settings_desc')}</p>
                        
                        {/* دکمه با عملکرد امنیتی */}
                        <Button 
                            variant="default" 
                            onClick={handleSecureAccess} 
                            disabled={isVerifying || isLoading}
                            className="w-full sm:w-auto"
                        >
                            {isVerifying ? (
                                <>
                                    <DaoLoadingSpinner className="mr-2 h-4 w-4" />
                                    {t('dashboard.verifying_identity')}
                                </>
                            ) : (
                                t('dashboard.manage_security')
                            )}
                        </Button>
                    </div>

                    <div className="p-6 border rounded-lg bg-muted/20">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            {t('dashboard.user_management')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('dashboard.user_management_desc')}</p>
                        <Button variant="outline" asChild>
                            <Link href="/admin/users">{t('dashboard.manage_users')}</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2"><InvestmentChart /></div>
                    <div><ActivityFeed /></div>
                </div>
            </div>
        );
    };

    // --- Main Render Logic (Hybrid Dashboard) ---
    if (!isHydrated) return <div className="flex justify-center p-8"><DaoLoadingSpinner /></div>;

    const renderDashboard = () => {
        // ۱. منطق هوشمند برای سرمایه‌گذاران و رای‌دهندگان
        // اگر کاربر نقش Investor یا Voter دارد، بررسی می‌کنیم آیا قدرتی به او تفویض شده؟
        if (userRole === 'investor' || userRole === 'voter') {
            if (hasDelegatedPower) {
                // ✅ اگر قدرت تفویضی داشت، تب‌ها را نشان بده
                return (
                    <Tabs defaultValue="investor" className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <TabsList>
                                <TabsTrigger value="investor">
                                    <PieChart className="w-4 h-4 me-2" />
                                    {t('dashboard.tab_investor')}
                                </TabsTrigger>
                                <TabsTrigger value="delegate">
                                    <UserCheck className="w-4 h-4 me-2" />
                                    {t('dashboard.tab_delegate')}
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        
                        <TabsContent value="investor">
                            <InvestorView />
                        </TabsContent>
                        <TabsContent value="delegate">
                            <DelegateView />
                        </TabsContent>
                    </Tabs>
                );
            }
            
            // ✅ اگر قدرت تفویضی نداشت، فقط نمای ساده سرمایه‌گذار را برگردان (بدون تب)
            // در اینجا اگر نقش voter بود و استیک نداشت، می‌توانیم DelegateView خالی نشان دهیم
            if (userRole === 'voter') return <DelegateView />;
            return <InvestorView />;
        }

        // ۲. منطق ساده برای سایر نقش‌ها
        switch (userRole) {
            case 'startup': return <StartupView />;
            case 'delegate': return <DelegateView />; // اگر کسی فقط نقش Delegate داشت
            case 'admin': return <AdminView />;
            default: return <InvestorView />;
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('dashboard.title')}</h1>
                    <p className="text-muted-foreground">
                        {userRole === 'investor' && !hasDelegatedPower && t('dashboard.investor_welcome')}
                        {(userRole === 'investor' || userRole === 'voter') && hasDelegatedPower && t('dashboard.hybrid_welcome')}
                        {userRole === 'startup' && t('dashboard.startup_welcome')}
                        {userRole === 'delegate' && t('dashboard.delegate_welcome')}
                        {userRole === 'admin' && t('dashboard.admin_welcome')}
                        {!userRole && t('dashboard.guest_welcome')}
                    </p>
                </div>
                
                {/* دکمه‌های میانبر هوشمند بر اساس وضعیت */}
                <div className="flex gap-2 w-full md:w-auto">
                     {hasDelegatedPower && (
                         <Button className="flex-1 md:flex-none" asChild>
                            <Link href="/proposals">{t('dashboard.cast_votes')}</Link>
                         </Button>
                     )}
                     <Button variant="outline" className="flex-1 md:flex-none" asChild><Link href="/staking">{t('menu.staking')}</Link></Button>
                </div>
            </header>

            {!userRole ? (
                <Alert>
                    <AlertTitle>{t('dashboard.connect_wallet_title')}</AlertTitle>
                    <AlertDescription>{t('dashboard.connect_wallet_desc')}</AlertDescription>
                </Alert>
            ) : (
                renderDashboard()
            )}
        </div>
    );
}