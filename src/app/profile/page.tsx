// src/app/profile/page.tsx - FINAL FIXED

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWeb3 } from '@/context/Web3Provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
    Settings, ShieldCheck, Server, KeyRound, 
    Gem, Banknote, Edit, Bell, User as UserIcon,
    History, Wallet, Crown, ExternalLink, Inbox, Rocket
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { formatEther } from 'viem';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/stat-card';
import { useLanguage } from '@/context/LanguageProvider';
import { useUserHistory } from '@/hooks/useUserHistory';
import { NotificationSettings, useUserProfile } from '@/hooks/useUserProfile';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/context/UserContext';

// --- Sub-Component: Admin Config Panel ---
const AdminConfigPanel = () => {
    const { t } = useTranslation(); // استفاده مستقیم از هوک برای سادگی
    const { info, transferLogic, isLoading } = useAdminProfile();
    const { newOwnerAddress, setNewOwnerAddress, handleTransfer, isPending, isButtonDisabled } = transferLogic;

    if (isLoading) return <div className="p-4 flex justify-center"><DaoLoadingSpinner /></div>;

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-start"><ShieldCheck className="w-5 h-5"/> {t('profile_page.platform_config_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 text-start">
                        <Label className="text-xs text-muted-foreground flex gap-1 items-center"><Server className="w-3 h-3"/> DAO Contract</Label>
                        <div className="font-mono text-sm bg-background p-2 rounded border truncate text-start" dir="ltr">{formatAddress(info.daoAddress)}</div>
                    </div>
                    <div className="space-y-1 text-start">
                        <Label className="text-xs text-muted-foreground flex gap-1 items-center"><KeyRound className="w-3 h-3"/> Token Contract</Label>
                        <div className="font-mono text-sm bg-background p-2 rounded border truncate text-start" dir="ltr">{formatAddress(info.tokenAddress)}</div>
                    </div>
                </div>
                <div className="border-t pt-4 text-start">
                    <Label className="mb-2 block">{t('profile_page.transfer_ownership_label')}</Label>
                    <p className="text-xs text-muted-foreground mb-2">{t('profile_page.transfer_ownership_desc')}</p>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="New Owner Address (0x...)" 
                            value={newOwnerAddress} 
                            onChange={(e) => setNewOwnerAddress(e.target.value)} 
                            className="bg-background text-start font-mono" 
                            dir="ltr" 
                        />
                        <Button onClick={handleTransfer} disabled={isButtonDisabled}>
                            {isPending ? <DaoLoadingSpinner /> : t('profile_page.transfer_button')}
                        </Button>
                    </div>
                    <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">{t('profile_page.live_contract_owner')}: </span>
                        <span className="font-mono">{info.contractOwner ? formatAddress(info.contractOwner) : '...'}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ProfilePage() {
    const { address, userRole } = useWeb3();
    const { t, locale } = useTranslation();
    const { direction } = useLanguage();

    // ✅ دریافت isStartup از هوک useUser (اصلاح اصلی)
    const { isStartup } = useUser(); 

    const { profile, setProfile, balances, isLoading, isSaving, updateProfile, notifications, setNotifications } = useUserProfile();
    const { isAdmin } = useAdminProfile();
    const { history, isLoading: isHistoryLoading } = useUserHistory();

    const handleSave = async () => {
        await updateProfile(profile);
    };

    const getVoteBadge = (voteType: number) => {
        if (voteType === 0) return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">{t('proposal_detail.vote_for')}</Badge>;
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">{t('proposal_detail.vote_against')}</Badge>;
    };

    return (
        <AppLayout>
            <div className="space-y-8 pb-10 max-w-6xl mx-auto animate-in fade-in duration-500">
                
                {/* --- 1. HERO HEADER --- */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 via-background to-background border border-border/50 shadow-sm p-6 md:p-10">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-start">
                        <div className="relative">
                            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                                <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} />
                                <AvatarFallback className="text-3xl bg-primary/20 text-primary">{userRole?.substring(0,1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <Badge className="absolute -bottom-2 -right-2 rtl:-right-auto rtl:-left-2 px-3 py-1 bg-primary text-primary-foreground border-2 border-background capitalize">
                                {t(`roles.${userRole || 'voter'}`)}
                            </Badge>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                            <h1 className="text-3xl font-bold font-headline text-gradient">
                                {profile.displayName || t('profile_page.welcome_user')}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-muted-foreground font-mono bg-muted/50 w-fit px-3 py-1 rounded-full mx-auto md:mx-0" dir="ltr">
                                <Wallet className="w-4 h-4" />
                                {address ? formatAddress(address) : '0x...'}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {/* دکمه ارتقا نقش یا نمایش وضعیت */}
                            {!isStartup ? (
                                <Button asChild variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                                    <Link href="/onboarding/startup">
                                        <Rocket className="w-4 h-4"/> {t('onboarding.title')}
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="ghost" disabled className="gap-2 text-green-600 bg-green-50">
                                    <ShieldCheck className="w-4 h-4"/> {t('roles.startup')}
                                </Button>
                            )}

                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <DaoLoadingSpinner /> : t('save_settings')}
                            </Button>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto p-8 opacity-[0.03] pointer-events-none transform rtl:-scale-x-100">
                        <Crown className="w-64 h-64" />
                    </div>
                </div>

                <Tabs defaultValue="overview" className="w-full" dir={direction}>
                    <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 rounded-lg">
                        <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background"><UserIcon className="w-4 h-4"/> {t('profile_page.overview')}</TabsTrigger>
                        <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-background"><History className="w-4 h-4"/> {t('profile_page.activity_history')}</TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background"><Settings className="w-4 h-4"/> {t('settings')}</TabsTrigger>
                    </TabsList>
                    
                    {/* --- TAB 1: OVERVIEW --- */}
                    <TabsContent value="overview" className="space-y-6 mt-6">
                        {/* Stats Grid */}
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                            <StatCard 
                                title={t('staking_page.ryc_balance')} 
                                value={`${formatNumber(formatEther((balances.ryc) ?? BigInt(0)), locale)} RYC`} 
                                icon={Banknote} 
                                description={t('dashboard.total_balance_desc')}
                                variant="default"
                                isLoading={isLoading}
                            />
                            <StatCard 
                                title={t('dashboard.native_balance')} 
                                value={`${formatNumber(balances.native?.formatted ?? '0', locale)} ${balances.native?.symbol}`} 
                                icon={Gem} 
                                description={t('dashboard.native_balance_desc')}
                                variant="neutral"
                                isLoading={isLoading}
                            />
                        </div>

                        {/* Edit Profile Form */}
                        <Card>
                            <CardHeader><CardTitle className="text-start">{t('profile_page.edit_profile')}</CardTitle></CardHeader>
                            <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                <div className="space-y-2 text-start">
                                    <Label htmlFor="displayName">{t('profile_page.display_name')}</Label>
                                    <Input 
                                        id="displayName" 
                                        value={profile.displayName} 
                                        onChange={(e) => setProfile(p => ({...p, displayName: e.target.value}))} 
                                        disabled={isLoading} 
                                    />
                                </div>
                                <div className="space-y-2 text-start">
                                    <Label htmlFor="email">{t('profile_page.email_for_notifications')}</Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        value={profile.email} 
                                        onChange={(e) => setProfile(p => ({...p, email: e.target.value}))} 
                                        disabled={isLoading} 
                                        className="text-start" 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Admin Config Panel (Only renders if admin) */}
                        {isAdmin && <AdminConfigPanel />}
                    </TabsContent>
                    
                {/* --- TAB 2: HISTORY --- */}
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-start">{t('profile_page.voting_history')}</CardTitle>
                            <CardDescription className="text-start">{t('profile_page.voting_history_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isHistoryLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    <Inbox className="w-12 h-12 mb-4 opacity-50" />
                                    <p>{t('logs_page.no_data')}</p>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-start w-[150px]">{t('profile_page.proposal_id')}</TableHead>
                                                <TableHead className="text-start">{t('profile_page.your_vote')}</TableHead>
                                                <TableHead className="text-start">{t('profile_page.date')}</TableHead>
                                                <TableHead className="text-end">{t('common.view_tx')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {history.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono text-muted-foreground text-start">
                                                        <Link href={`/proposals/${item.proposalId}`} className="hover:text-primary hover:underline transition-colors">
                                                            #{item.proposalId}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-start">
                                                        {getVoteBadge(item.voteType)}
                                                    </TableCell>
                                                    <TableCell className="text-start">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{formatLocaleDate(new Date(item.date * 1000), locale)}</span>
                                                            <span className="text-xs text-muted-foreground">Block: {item.blockNumber}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-end">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <a 
                                                                href={`https://amoy.polygonscan.com/tx/${item.id}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-muted-foreground hover:text-primary"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                    
                    {/* --- TAB 3: SETTINGS --- */}
                    <TabsContent value="settings" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-start"><Bell className="w-5 h-5"/> {t('profile_page.notification_settings')}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                {[
                                    { id: 'proposal', label: 'new_proposal_notif', desc: 'new_proposal_notif_desc' },
                                    { id: 'result', label: 'voting_result_notif', desc: 'voting_result_notif_desc' },
                                    { id: 'summary', label: 'weekly_summary_notif', desc: 'weekly_summary_notif_desc' }
                                ].map(item => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="space-y-0.5 text-start">
                                            <Label htmlFor={item.id} className="text-base">{t(`profile_page.${item.label}`)}</Label>
                                            <p className="text-sm text-muted-foreground">{t(`profile_page.${item.desc}`)}</p>
                                        </div>
                                        <Switch 
                                            id={item.id} 
                                            checked={notifications[item.id as keyof NotificationSettings]} 
                                            onCheckedChange={(c) => setNotifications(p => ({...p, [item.id]: c}))} 
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}