// src/components/dashboard/dashboard-page-content.tsx - FINAL SAFE VERSION

"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    
    const investorData = useInvestorDashboard();
    const startupData = useStartupDashboard();
    const delegateData = useDelegateDashboard();
    const adminData = useAdminDashboard();
    
    // ✅ Safe check for delegation power
    const hasDelegatedPower = delegateData.stats && delegateData.stats.receivedDelegation > 0n;

    // ✅ Safe formatter utility
    const formatVal = (val?: bigint) => formatNumber(formatEther(val ?? 0n), locale);
    const safeToString = (val: any) => val?.toString() ?? '0';

    // --- 1. INVESTOR VIEW ---
    const InvestorView = () => {
        const { stats, isLoading } = investorData;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title={t('dashboard.wallet_balance')} 
                        value={`${formatVal(stats?.walletBalance)} RYC`} 
                        icon={Wallet} 
                        description={t('dashboard.available_to_stake')} 
                        isLoading={isLoading} 
                    />
                    <StatCard 
                        title={t('dashboard.staked_amount')} 
                        value={`${formatVal(stats?.stakedAmount)} RYC`} 
                        icon={Layers} 
                        description={t('dashboard.earning_rewards')} 
                        variant="default" 
                        isLoading={isLoading} 
                    />
                    <StatCard 
                        title={t('dashboard.claimable_rewards')} 
                        value={`${formatVal(stats?.claimableRewards)} RYC`} 
                        icon={TrendingUp} 
                        description={t('dashboard.unclaimed_profit')} 
                        variant="positive" 
                        isLoading={isLoading} 
                    />
                    <StatCard 
                        title={t('dashboard.voting_power')} 
                        value={formatNumber(formatEther(stats?.votingPower ?? 0n), locale)} 
                        icon={Zap} 
                        description={`${t('dashboard.participation_score')}: ${safeToString(stats?.participationScore)}`} 
                        isLoading={isLoading} 
                    />
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
                     <StatCard title={t('dashboard.total_projects')} value={safeToString(stats.totalProposals)} icon={Layers} description={t('dashboard.all_time')} isLoading={isLoading} />
                     <StatCard title={t('dashboard.active_projects')} value={safeToString(stats.activeProposals)} icon={Zap} description={t('dashboard.currently_voting_funding')} variant="neutral" isLoading={isLoading} />
                     <StatCard title={t('dashboard.successful_funded')} value={safeToString(stats.successfulProjects)} icon={Award} description={t('dashboard.fully_funded')} variant="positive" isLoading={isLoading} />
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
                    <StatCard 
                        title={t('dashboard.total_governance_power')} 
                        value={formatVal(stats?.totalVotingPower)} 
                        icon={Crown} 
                        description={t('dashboard.combined_power')} 
                        variant="default" 
                        isLoading={isLoading} 
                    />
                    <StatCard 
                        title={t('dashboard.delegated_to_me')} 
                        value={formatVal(stats?.receivedDelegation)} 
                        icon={Users} 
                        description={`${t('dashboard.trust_percentage')}: ${safeToString(stats?.delegationPercentage)}%`} 
                        variant="neutral" 
                        isLoading={isLoading} 
                    />
                    <StatCard 
                        title={t('dashboard.my_skin_in_game')} 
                        value={`${formatVal(stats?.selfStaked)} RYC`} 
                        icon={Shield} 
                        description={t('dashboard.personal_stake')} 
                        isLoading={isLoading} 
                    />
                    <StatCard 
                        title={t('dashboard.reputation_score')} 
                        value={safeToString(stats?.participationScore)} 
                        icon={Award} 
                        description={t('dashboard.activity_based_rank')} 
                        isLoading={isLoading} 
                    />
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

    // --- 4. ADMIN VIEW ---
    const AdminView = () => {
        const { stats, isLoading } = adminData;
        const router = useRouter();
        const { signMessageAsync } = useSignMessage();
        const [isVerifying, setIsVerifying] = useState(false);
        const secureHash = process.env.NEXT_PUBLIC_ADMIN_HASH;

        const handleSecureAccess = async () => {
            if (!secureHash) {
                toast.error(t('dashboard.security_config_error'));
                return;
            }

            try {
                setIsVerifying(true);
                const timestamp = new Date().toLocaleString();
                // ✅ Safe check for owner
                const message = `${t('dashboard.security_access_request')}\n\nTime: ${timestamp}\nAdmin: ${stats?.owner ?? 'Unknown'}`;

                await signMessageAsync({ message });
                toast.success(t('dashboard.access_granted'));
                router.push(`/admin/${secureHash}/`);

            } catch (error) {
                console.error("Signature denied:", error);
                toast.error(t('dashboard.access_denied'));
            } finally {
                setIsVerifying(false);
            }
        };

        return (
            <div className="space-y-6">
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
                        value={`${formatVal(stats?.treasuryBalance)} RYC`} 
                        icon={Banknote} 
                        description={t('dashboard.available_funds')}
                        variant="default" 
                        isLoading={isLoading}
                    />
                    <StatCard 
                        title={t('dashboard.total_proposals_title')} 
                        value={safeToString(stats?.totalProposals)} 
                        icon={Layers} 
                        description={t('dashboard.all_time_stats')}
                        isLoading={isLoading}
                    />
                    <StatCard 
                        title={t('dashboard.contract_owner')} 
                        // ✅ Safe substring
                        value={stats?.owner ? `${stats.owner.substring(0, 6)}...` : '...'} 
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

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-6 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <LockKeyhole className="h-5 w-5 text-primary" />
                            {t('dashboard.security_settings')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('dashboard.security_settings_desc')}</p>
                        
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

    if (!isHydrated) return <div className="flex justify-center p-8"><DaoLoadingSpinner /></div>;

    const renderDashboard = () => {
        if (userRole === 'investor' || userRole === 'voter') {
            if (hasDelegatedPower) {
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
            if (userRole === 'voter') return <DelegateView />;
            return <InvestorView />;
        }

        switch (userRole) {
            case 'startup': return <StartupView />;
            case 'delegate': return <DelegateView />;
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