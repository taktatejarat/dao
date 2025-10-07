"use client";

import { useState, useMemo } from 'react';
import { useWeb3 } from '@/context/Web3Provider';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StakingPlanCard } from '@/components/staking/staking-plan-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Briefcase, Vote } from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';
import { formatNumber } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import type { UserRole } from '@/context/Web3Provider';
import { useRouter } from 'next/navigation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useReadContract } from 'wagmi';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import type { Address } from 'viem';

export default function RoleSelectionPage() {
    const { setUserRole, address, registryAddress, isHydrated } = useWeb3();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState("investor");
    const { locale, direction } = useLanguage();
    const { t } = useTranslation();

    const { data: accControlAddressResult, isLoading: isAddressLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.ACC_CONTROL],
        query: { enabled: !!registryAddress && isHydrated },
    });
    const accControlAddress = accControlAddressResult as Address | undefined;

    const investorPlans = useMemo(() => [
        { title: t('role_selection.plan_bronze_title'), tier: "bronze" as const, description: t('role_selection.plan_bronze_desc'), price: "10000000", features: [t('role_selection.plan_bronze_feat1'), t('role_selection.plan_bronze_feat2'), t('role_selection.plan_bronze_feat3')] },
        { title: t('role_selection.plan_silver_title'), tier: "silver" as const, description: t('role_selection.plan_silver_desc'), price: "50000000", features: [t('role_selection.plan_silver_feat1'), t('role_selection.plan_silver_feat2'), t('role_selection.plan_silver_feat3'), t('role_selection.plan_silver_feat4')], isFeatured: true },
        { title: t('role_selection.plan_gold_title'), tier: "gold" as const, description: t('role_selection.plan_gold_desc'), price: "200000000", features: [t('role_selection.plan_gold_feat1'), t('role_selection.plan_gold_feat2'), t('role_selection.plan_gold_feat3'), t('role_selection.plan_gold_feat4')] }
    ], [t]);

    // --- Main Handler for Role Selection ---
    const handleRoleSelect = (role: UserRole, amount?: string) => {
        // ✅ FIX: No more role granting logic here. Roles are self-service.
        setUserRole(role);
        if (typeof window !== 'undefined') {
            localStorage.setItem('userRole', role as string);
        }
        if (role === 'investor' && amount) {
            // Investor role is chosen, redirect to staking page with amount
            router.push(`/staking?amount=${amount}`);
        } else if (role === 'startup') {
            // Startup role is chosen, check if user has Stake (will be checked by the contract on proposal creation)
            router.push('/dashboard'); 
        } else {
            // Voter/Delegate (Default)
            router.push('/dashboard');
        }
    };
    
    if (!isHydrated || isAddressLoading) {
        return <div className="flex justify-center items-center h-screen"><DaoLoadingSpinner /></div>;
    }

    return (
        <div dir={direction} className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
            <div className="w-full">
                <div className="text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold font-headline mb-2">{t('role_selection.welcome')}</h1>
                    <p className="text-muted-foreground mb-8 text-lg">{t('role_selection.prompt')}</p>
                </div>
                
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-8 max-w-lg mx-auto">
                        <TabsTrigger value="investor"><Briefcase className="me-2" />{t('role_selection.investor')}</TabsTrigger>
                        <TabsTrigger value="startup"><Rocket className="me-2" />{t('role_selection.startup')}</TabsTrigger>
                        <TabsTrigger value="voter"><Vote className="me-2" />{t('role_selection.voter')}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="investor">
                         <div className="text-center mb-8">
                             <h2 className="text-2xl font-semibold">{t('role_selection.investor_title')}</h2>
                             <p className="text-muted-foreground mt-1">{t('role_selection.investor_subtitle')}</p>
                         </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {investorPlans.map((plan) => (
                               <StakingPlanCard 
                                 key={plan.title} 
                                 tier={plan.tier} 
                                 price={formatNumber(plan.price, locale)}
                                 title={plan.title}
                                 description={plan.description}
                                 features={plan.features}
                                 isFeatured={plan.isFeatured}
                                 onSelect={() => handleRoleSelect('investor', plan.price)} 
                               />
                           ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="startup">
                        <Card className="max-w-md mx-auto border-2 border-border shadow-lg">
                             <CardHeader className="text-center">
                                <Rocket className="w-16 h-16 mx-auto text-primary mb-4" />
                                <CardTitle className="font-headline">{t('role_selection.startup_title')}</CardTitle>
                             </CardHeader>
                             <CardContent className="text-center">
                                <p className="text-muted-foreground">
                                  {t('role_selection.startup_desc')}
                                </p>
                             </CardContent>
                             <CardFooter>
                                <Button className="w-full" onClick={() => handleRoleSelect('startup')}>
                                    {isLoading ? (
                                    <>
                                        <DaoLoadingSpinner className="me-2" />
                                        {t('role_selection.granting_role')}
                                    </>
                                    ) : (
                                    t('role_selection.startup_cta')
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="voter">
                        <Card className="max-w-md mx-auto border-2 border-border shadow-lg">
                            <CardHeader className="text-center">
                                <Vote className="w-16 h-16 mx-auto text-primary mb-4" />
                                <CardTitle className="font-headline">{t('role_selection.voter_title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-muted-foreground">
                                    {t('role_selection.voter_desc')}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleRoleSelect('voter')}>{t('role_selection.voter_cta')}</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}