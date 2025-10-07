"use client";

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWeb3 } from '@/context/Web3Provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart3, Settings, FileText, ShieldCheck, Server, KeyRound, Gem, Banknote, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useBalance, useReadContract } from 'wagmi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatEther, type Address } from 'viem';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import Link from 'next/link';
import { daoRegistryAbi, rayanChainDaoAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useOwnershipTransfer } from '@/hooks/useOwnershipTransfer';

type UserProfileData = {
    displayName: string;
    email: string;
}
type NotificationSettings = {
    proposal: boolean;
    result: boolean;
    summary: boolean;
}


function useProfileContractAddresses() {
    const { registryAddress, isHydrated } = useWeb3();

    const { data: token, isLoading: l1 } = useReadContract({ 
        address: registryAddress as Address,
        abi: daoRegistryAbi, 
        functionName: 'getAddress', 
        args: [REGISTRY_KEYS.TOKEN] as const,
        query: { enabled: !!registryAddress && isHydrated }
    });
    
    const { data: dao, isLoading: l2 } = useReadContract({ 
        address: registryAddress as Address,
        abi: daoRegistryAbi, 
        functionName: 'getAddress', 
        args: [REGISTRY_KEYS.DAO] as const,
        query: { enabled: !!registryAddress && isHydrated }
    });

    return {
        addresses: {
            dao: dao as Address | undefined,
            token: token as Address | undefined,
        },
        isLoading: l1 || l2,
    };
}

export default function ProfilePage() {
    const { address, userRole, isHydrated } = useWeb3();
    const { t, locale } = useTranslation();
    
    const [profile, setProfile] = useState<UserProfileData>({ displayName: '', email: '' });
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [notifications, setNotifications] = useState<NotificationSettings>({ proposal: true, result: true, summary: false });

    const { addresses } = useProfileContractAddresses();
    const { dao: daoAddress, token: tokenAddress } = addresses;

    const {
        newOwnerAddress,
        setNewOwnerAddress,
        handleTransfer,
        isPending,
        isButtonDisabled,
    } = useOwnershipTransfer({ daoAddress });
    
    // --- Data Fetching Hooks ---
    const { data: nativeBalance, isLoading: isNativeBalanceLoading } = useBalance({ address: address || undefined });
    
    const { data: rycBalance, isLoading: isRycBalanceLoading } = useReadContract({
        address: tokenAddress,
        abi: rayanChainTokenAbi,
        functionName: 'balanceOf',
        args: [address!],
        query: { enabled: !!address && !!tokenAddress },
    });

    const { data: contractOwner, isLoading: isOwnerLoading } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'owner',
        query: { enabled: !!daoAddress },
    });

    // --- Side Effects ---
    useEffect(() => {
        async function fetchProfile() {
            if (address) {
                setIsLoadingProfile(true);
                try {
                    const response = await fetch(`/api/profile?address=${address}`);
                    if (response.ok) {
                        const data = await response.json();
                        setProfile(data);
                    }
                } finally {
                    setIsLoadingProfile(false);
                }
            }
        }
        if (isHydrated) {
            fetchProfile();
        }
    }, [address, isHydrated]);

    // --- Event Handlers ---
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.id]: e.target.value });
    };

    const handleSaveProfile = async () => {
        if (!profile || !address) return;
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, ...profile }),
            });
            if (response.ok) {
                toast.success(t('profile_page.profile_saved'));
            } else {
                toast.error(t('profile_page.error_title'));
            }
        } catch (error) {
             toast.error(t('profile_page.error_title'));
        }
    };

    // --- Static Data for Display ---
    const direction = locale === 'fa' ? 'rtl' : 'ltr';
    const votingHistory = [
      { id: 'vh001', proposalId: 'P001', titleKey: 'proposals.network_upgrade', voteKey: 'profile_page.positive', date: new Date('2024-07-01') },
      { id: 'vh002', proposalId: 'P002', titleKey: 'proposals.mobile_dapp', voteKey: 'profile_page.negative', date: new Date('2024-06-29') },
      { id: 'vh003', proposalId: 'P003', titleKey: 'proposals.defi_integration', voteKey: 'profile_page.positive', date: new Date('2024-06-15') },
    ];


    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">{t('profile_page.title')}</h1>
                <p className="text-muted-foreground">{t('profile_page.subtitle')}</p>
            </header>

            <Tabs defaultValue="overview" className="w-full" dir={direction}>
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                    <TabsTrigger value="overview"><BarChart3 className="mx-2"/>{t('profile_page.overview')}</TabsTrigger>
                    <TabsTrigger value="history"><FileText className="mx-2"/>{t('profile_page.activity_history')}</TabsTrigger>
                    <TabsTrigger value="settings"><Settings className="mx-2"/>{t('settings')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
                            <Avatar className="h-24 w-24 border-4 border-primary/50 shadow-md">
                                <AvatarImage src={`https://placehold.co/96x96.png?text=${userRole?.substring(0,1).toUpperCase()}`} />
                                <AvatarFallback>{userRole?.substring(0,1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-2xl font-headline">
                                    {userRole ? t('profile_page.user_role').replace('{role}', t(userRole)) : t('auth_guard.loading')}
                                </CardTitle>
                                <CardDescription className="break-all mt-1 font-mono text-xs">{address || '0x...'}</CardDescription>
                                <div className="mt-2 flex gap-2 justify-center sm:justify-start">
                                    <Badge variant="secondary">{t('profile_page.status_active')}</Badge>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/role-selection"><Edit className="me-2 size-3"/> {t('profile_page.change_role')}</Link>
                                    </Button>
                                </div>
                            </div>
                            <Button onClick={handleSaveProfile}>{t('save_settings')}</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                               {isLoadingProfile ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="displayName">{t('profile_page.display_name')}</Label>
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="email">{t('profile_page.email_for_notifications')}</Label>
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </>
                               ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">{t('profile_page.display_name')}</Label>
                                        <Input id="displayName" value={profile?.displayName || ''} onChange={handleProfileChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('profile_page.email_for_notifications')}</Label>
                                        <Input id="email" type="email" placeholder="you@example.com" value={profile?.email || ''} onChange={handleProfileChange} />
                                    </div>
                                </>
                               )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                                <Banknote className="w-6 h-6 text-primary"/>
                                <CardTitle className="text-lg">{t('staking_page.ryc_balance')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isRycBalanceLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-3xl font-bold">{formatNumber(formatEther((rycBalance as bigint) ?? BigInt(0)), locale)} RYC</p>}
                                <p className="text-sm text-muted-foreground">{t('dashboard.total_balance_desc')}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                                <Gem className="w-6 h-6 text-secondary"/>
                                <CardTitle className="text-lg">{t('dashboard.native_balance')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isNativeBalanceLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-3xl font-bold">{formatNumber(nativeBalance?.formatted ?? '0', locale)} {nativeBalance?.symbol}</p>}
                                <p className="text-sm text-muted-foreground">{t('dashboard.native_balance_desc')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {userRole === 'admin' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/> {t('profile_page.platform_config_title')}</CardTitle>
                                <CardDescription>{t('profile_page.platform_config_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-muted-foreground"><Server className="w-4 h-4" />{t('profile_page.deployed_contract_address')} (DAO)</Label>
                                            <p className="font-mono text-sm p-3 bg-muted rounded-md mt-1 break-all">
                                                {!isHydrated || !daoAddress ? t('profile_page.loading') : formatAddress(daoAddress)}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-muted-foreground"><KeyRound className="w-4 h-4" />{t('dashboard.token_contract')}</Label>
                                            <p className="font-mono text-sm p-3 bg-muted rounded-md mt-1 break-all">
                                                {!isHydrated || !tokenAddress ? t('profile_page.loading') : formatAddress(tokenAddress)}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="w-4 h-4" />{t('profile_page.live_contract_owner')}</Label>
                                            <p className="font-mono text-sm p-3 bg-muted rounded-md mt-1 break-all">
                                                {isOwnerLoading ? t('profile_page.loading') : (contractOwner as string ? formatAddress(contractOwner as Address) : 'Not set')}
                                            </p>
                                        </div>
                                        <div>
                                    <Label htmlFor="new-owner">{t('profile_page.transfer_ownership_label')}</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {t('profile_page.transfer_ownership_desc')}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input
                                            id="new-owner"
                                            placeholder="0x..."
                                            value={newOwnerAddress}
                                            onChange={(e) => setNewOwnerAddress(e.target.value)}
                                        />
                                        <Button 
                                            onClick={handleTransfer}
                                            disabled={isButtonDisabled}
                                        >
                                            {isPending ? <DaoLoadingSpinner /> : t('profile_page.transfer_button')}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile_page.voting_history')}</CardTitle>
                            <CardDescription>{t('profile_page.voting_history_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-start">{t('profile_page.proposal_id')}</TableHead>
                                        <TableHead className="text-start">{t('profile_page.proposal_title')}</TableHead>
                                        <TableHead className="text-start">{t('profile_page.your_vote')}</TableHead>
                                        <TableHead className="text-start">{t('profile_page.date')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {votingHistory.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono">{item.proposalId}</TableCell>
                                            <TableCell className="font-medium">{t(item.titleKey)}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.voteKey === 'profile_page.positive' ? 'success' : 'destructive'}>{t(item.voteKey)}</Badge>
                                            </TableCell>
                                            <TableCell>{formatLocaleDate(item.date, locale)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile_page.notification_settings')}</CardTitle>
                            <CardDescription>{t('profile_page.notification_settings_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="text-start">
                                    <Label htmlFor="proposal-notif" className="font-semibold">{t('profile_page.new_proposal_notif')}</Label>
                                    <p className="text-sm text-muted-foreground">{t('profile_page.new_proposal_notif_desc')}</p>
                                </div>
                                <Switch id="proposal-notif" checked={notifications.proposal} onCheckedChange={(checked) => setNotifications(prev => ({...prev, proposal: checked}))} />
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="text-start">
                                    <Label htmlFor="result-notif" className="font-semibold">{t('profile_page.voting_result_notif')}</Label>
                                    <p className="text-sm text-muted-foreground">{t('profile_page.voting_result_notif_desc')}</p>
                                </div>
                                <Switch id="result-notif" checked={notifications.result} onCheckedChange={(checked) => setNotifications(prev => ({...prev, result: checked}))} />
                            </div>
                             <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="text-start">
                                    <Label htmlFor="summary-notif" className="font-semibold">{t('profile_page.weekly_summary_notif')}</Label>
                                    <p className="text-sm text-muted-foreground">{t('profile_page.weekly_summary_notif_desc')}</p>
                                </div>
                                <Switch id="summary-notif" checked={notifications.summary} onCheckedChange={(checked) => setNotifications(prev => ({...prev, summary: checked}))} />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button>{t('save_settings')}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
  }