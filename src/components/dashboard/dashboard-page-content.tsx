"use client";

import { useWeb3 } from "@/context/Web3Provider";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProposalsList } from "@/components/dashboard/proposals-list";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { InvestmentChart } from "@/components/dashboard/investment-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, FileText, CheckSquare, Users, Award, Target, KeyRound, Server, Banknote, BrainCircuit, AlertTriangle, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { daoRegistryAbi, rayanChainDaoAbi, rayanChainTokenAbi, stakingAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import type { Address } from "viem";
import { useMemo } from "react";
import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";
import { AiOracleStatus } from "./ai-oracle-status"; // ✅ NEW IMPORT

function useContractAddresses() {
    const { registryAddress, isHydrated } = useWeb3();
    const queryConfig = { query: { enabled: !!registryAddress && isHydrated } };

    const { data: dao, isLoading: l1 } = useReadContract({ address: registryAddress ?? undefined, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO], ...queryConfig });
    const { data: token, isLoading: l2 } = useReadContract({ address: registryAddress ?? undefined, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN], ...queryConfig });
    const { data: finance, isLoading: l3 } = useReadContract({ address: registryAddress ?? undefined, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE], ...queryConfig });
    const { data: staking, isLoading: l4 } = useReadContract({ address: registryAddress ?? undefined, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING], ...queryConfig });

    return {
        addresses: {
            dao: dao as Address | undefined,
            token: token as Address | undefined,
            finance: finance as Address | undefined,
            staking: staking as Address | undefined,
        },
        isLoading: l1 || l2 || l3 || l4,
    };
}

export function DashboardPageContent() {
  const { userRole, address, isHydrated, registryAddress } = useWeb3();
  const { t, locale } = useTranslation();
  const { isConnected } = useAccount();

  // مرحله ۱: خواندن آدرس‌ها
  const { addresses, isLoading: areAddressesLoading } = useContractAddresses();
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
  const isNonZero = (addr?: Address) => !!addr && addr !== ZERO_ADDRESS;
  const missingModules = useMemo(() => {
    const missing: string[] = [];
    if (!isNonZero(addresses.dao)) missing.push('DAO');
    if (!isNonZero(addresses.token)) missing.push(t('dashboard.token_contract'));
    if (!isNonZero(addresses.finance)) missing.push(t('dashboard.treasury'));
    if (!isNonZero(addresses.staking)) missing.push('Staking');
    return missing;
  }, [addresses, t]);

  
  // داده‌های کاربر
  const { data: userBalance, isLoading: l5 } = useReadContract({ address: addresses.token, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [address!], query: { enabled: isConnected && isHydrated && isNonZero(addresses.token) && !!address } });
  const { data: userStaked, isLoading: l6 } = useReadContract({ address: addresses.staking, abi: stakingAbi, functionName: 'getStakedAmount', args: [address!], query: { enabled: isConnected && isHydrated && isNonZero(addresses.staking) && !!address } });
  const { data: userPoPScore, isLoading: l7 } = useReadContract({ address: addresses.dao, abi: rayanChainDaoAbi, functionName: 'participationScores', args: [address!], query: { enabled: isConnected && isHydrated && isNonZero(addresses.dao) && !!address } });
  
  // داده‌های کلی پلتفرم
  const { data: proposalCountResult, isLoading: l8 } = useReadContract({ address: addresses.dao, abi: rayanChainDaoAbi, functionName: 'nextProposalId', query: { enabled: isConnected && isHydrated && isNonZero(addresses.dao) } });
  const { data: ownerResult, isLoading: l9 } = useReadContract({ address: addresses.dao, abi: rayanChainDaoAbi, functionName: 'owner', query: { enabled: isConnected && isHydrated && isNonZero(addresses.dao) } });
  const { data: tokenTotalSupplyResult, isLoading: l10 } = useReadContract({ address: addresses.token, abi: rayanChainTokenAbi, functionName: 'totalSupply', query: { enabled: isConnected && isHydrated && isNonZero(addresses.token) } });
  const { data: treasuryBalanceResult, isLoading: l11 } = useReadContract({ address: addresses.token, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [addresses.finance!], query: { enabled: isConnected && isHydrated && isNonZero(addresses.token) && isNonZero(addresses.finance) } });
  const { data: totalStakedResult, isLoading: l12 } = useReadContract({ address: addresses.staking, abi: stakingAbi, functionName: 'totalSupply', query: { enabled: isConnected && isHydrated && isNonZero(addresses.staking) } });

  const formatBigInt = (value: unknown) => {
    return (typeof value === 'bigint') ? formatNumber(formatEther(value), locale) : '0';
  };
  
  const isLoading = areAddressesLoading || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12;
 
    const MainContent = () => {
      // وضعیت ۱: منتظر اتصال کیف پول
      if (!isConnected) {
          return (
              <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertTitle>{t('dashboard.connect_to_see_data_title')}</AlertTitle>
                  <AlertDescription>{t('dashboard.connect_to_see_data')}</AlertDescription>
              </Alert>
          );
      }
      
      // وضعیت ۲: قرارداد رجیستری اصلاً مستقر نشده است
      if (!registryAddress) {
          return (
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('dashboard.contract_not_deployed_title')}</AlertTitle>
                  <AlertDescription>
                      {t('dashboard.contract_not_deployed_desc')}
                      <Button asChild size="sm" className="mt-4"><Link href="/setup">{t('setup_page.go_to_setup')}</Link></Button>
                  </AlertDescription>
              </Alert>
          );
      }
  
      // وضعیت ۳: در حال خواندن آدرس‌های داخلی از رجیستری (حل Race Condition)
      if (areAddressesLoading) {
          return (
              <div className="flex flex-col items-center justify-center min-h-[50vh]">
                  <DaoLoadingSpinner className="w-12 h-12" />
                  <p className="mt-4 text-muted-foreground">{t('dashboard.loading_contracts')}</p>
              </div>
          );
      }
  
      // وضعیت ۴: راه‌اندازی ناقص (برخی ماژول‌ها آدرس معتبر ندارند)
      if (missingModules.length > 0) {
          return (
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('dashboard.partial_setup_title')}</AlertTitle>
                  <AlertDescription>
                      {t('dashboard.partial_setup_desc')}
                      <code className="block bg-muted p-2 rounded-md my-2 text-xs">{missingModules.join(', ')}</code>
                      <Button asChild size="sm" className="mt-4"><Link href="/setup">{t('setup_page.go_to_setup_to_reset')}</Link></Button>
                  </AlertDescription>
              </Alert>
          );
      }
  
      // وضعیت ۵: همه چیز عالی است! داشبورد اصلی را نمایش بده.
      return renderDashboardByRole();
    };
  // --- Rendering the dashboards based on role ---
  const renderInvestorDashboard = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard isLoading={isLoading} title={t('dashboard.your_balance')} value={`${formatBigInt(userBalance)} RYC`} icon={Wallet} description={t('dashboard.total_balance_desc')} />
        <StatCard isLoading={isLoading} title={t('staking_page.staked_balance')} value={`${formatBigInt(userStaked)} RYC`} icon={Banknote} description={t('staking_page.staked_balance_desc')} />
        <StatCard isLoading={isLoading} title={t('activities.participation_score')} value={userPoPScore?.toString() ?? '0'} icon={Award} description={t('activities.participation_score_desc')} />
        <StatCard isLoading={isLoading} title={t('dashboard.active_proposals_count')} value={proposalCountResult ? (Number(proposalCountResult) > 0 ? Number(proposalCountResult)-1 : 0).toString() : '0'} icon={FileText} description={t('dashboard.active_proposals_cta')} />
      </div>
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3"><InvestmentChart /></div>
        <div className="lg:col-span-2"><ActivityFeed /></div>
      </div>
       <ProposalsList />
    </>
  );

  const renderStartupDashboard = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.your_proposals')} value={"0"} icon={FileText} description={t('dashboard.your_proposals_desc')} />
        <StatCard title={t('dashboard.capital_raised')} value={`0 RYC`} icon={Target} description={t('dashboard.capital_raised_desc')} variant="positive" />
        <StatCard title={t('dashboard.latest_proposal_status')} value={t('dashboard.no_proposals_status')} icon={Users} description={t('dashboard.no_proposals_status_desc')} />
      </div>
      <div className="p-6 border rounded-lg bg-card text-card-foreground">
        <h2 className="text-2xl font-headline mb-4">{t('dashboard.new_project_prompt_title')}</h2>
        <p className="text-muted-foreground mb-4">{t('dashboard.new_project_prompt_desc')}</p>
        <Button asChild><Link href="/proposals/new">{t('dashboard.new_project_prompt_cta')}</Link></Button>
      </div>
      <ProposalsList />
    </>
  );


  const renderAdminDashboard = () => (
    <>
      <h2 className="text-2xl font-semibold mb-4">{t('dashboard.admin_overview_title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AiOracleStatus />
        <StatCard isLoading={isLoading} title={t('dashboard.contract_owner')} value={ownerResult ? `${(ownerResult as string).substring(0, 6)}...` : '...'} icon={KeyRound} description={t('dashboard.contract_owner_desc')} />
        <StatCard isLoading={isLoading} title={t('dashboard.total_proposals_title')} value={proposalCountResult ? (Number(proposalCountResult) > 0 ? Number(proposalCountResult)-1 : 0).toString() : '0'} icon={FileText} description={t('dashboard.total_proposals_desc')} />
        <StatCard isLoading={isLoading} title={t('dashboard.treasury_balance')} value={`${formatBigInt(treasuryBalanceResult)} RYC`} icon={ShieldCheck} description={t('dashboard.treasury_balance_desc')} />
        <StatCard isLoading={isLoading} title={t('dashboard.total_staked')} value={`${formatBigInt(totalStakedResult)} RYC`} icon={Users} description={t('dashboard.total_staked_desc')} />
      </div>
      <div className="grid gap-8 lg:grid-cols-5 mt-8">
        <div className="lg:col-span-3"><InvestmentChart /></div>
        <div className="lg:col-span-2"><ActivityFeed /></div>
      </div>
      <ProposalsList />
    </>
  );
  
  const renderVoterDashboard = () => (
     <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard isLoading={isLoading} title={t('dashboard.your_balance')} value={`${formatBigInt(userBalance)} RYC`} icon={Wallet} description={t('dashboard.total_balance_desc')} />
        <StatCard isLoading={isLoading} title={t('dashboard.staked_balance')} value={`${formatBigInt(userStaked)} RYC`} icon={Banknote} description={t('dashboard.staked_balance_desc')} />
        <StatCard isLoading={isLoading} title={t('dashboard.participation_score')} value={userPoPScore?.toString() ?? '0'} icon={BrainCircuit} description={t('dashboard.participation_score_desc')} />
        <StatCard isLoading={isLoading} title={t('dashboard.active_proposals_count')} value={proposalCountResult ? (Number(proposalCountResult) > 0 ? Number(proposalCountResult)-1 : 0).toString() : '0'} icon={CheckSquare} description={t('dashboard.active_proposals_cta')} />
      </div>
       <ActivityFeed />
       <ProposalsList />
    </>
  );

  const renderDashboardByRole = () => {
    switch (userRole) {
      case 'admin': return renderAdminDashboard();
      case 'investor': return renderInvestorDashboard();
      case 'startup': return renderStartupDashboard();
      case 'voter': return renderVoterDashboard();
      default: return renderVoterDashboard();
    }
  };


  return (
    <div className="space-y-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold font-headline">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome_message')}</p>
      </header>

      {/* فقط کامپوننت MainContent را رندر می‌کنیم که تمام منطق را در خود دارد */}
      {isHydrated ? <MainContent /> : (
          <div className="flex justify-center p-8"><DaoLoadingSpinner /></div>
      )}
    </div>
  );
}