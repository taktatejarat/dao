// src/app/proposals/[id]/page.tsx - FINAL, ROBUST, AND ERROR-FREE VERSION

"use client";

import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useWeb3 } from '@/context/Web3Provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BrainCircuit, Scale, LineChart, Users as TeamIcon,
         AlertTriangle, Banknote, Calendar, Check, Clock,
         Info, ShieldCheck, User, Users, X } from 'lucide-react';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { formatEther, type Address } from 'viem';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReadContract } from 'wagmi';
import { daoRegistryAbi, rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useProposalVote } from '@/hooks/useProposalVote';

// --- Helper Components & Functions ---
interface OnChainProposal {
    id: bigint;
    proposer: Address;
    forVotes: bigint;
    againstVotes: bigint;
    state: bigint;
    deadline: bigint;
    executed: boolean;
    aiRiskScore: bigint;
}

const InfoCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Icon className="w-6 h-6 text-muted-foreground" />
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-semibold">{value}</p>
        </div>
    </div>
);

const getStatusInfo = (state: bigint, t: (key: string) => string) => {
    switch (state) {
        case 0n: return { text: t('proposal_detail.status.pending'), color: 'bg-gray-500', icon: Clock };
        case 1n: return { text: t('proposal_detail.status.active'), color: 'bg-blue-500', icon: Clock };
        case 2n: return { text: t('proposal_detail.status.voting'), color: 'bg-yellow-500', icon: Clock };
        case 3n: return { text: t('proposal_detail.status.approved'), color: 'bg-green-600', icon: Check };
        case 4n: return { text: t('proposal_detail.status.rejected'), color: 'bg-red-600', icon: X };
        case 5n: return { text: t('proposal_detail.status.executed'), color: 'bg-purple-600', icon: ShieldCheck };
        default: return { text: t('proposal_detail.status.unknown'), color: 'bg-gray-700', icon: Info };
    }
};

const SkeletonUI = () => (
    <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
            </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-10 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-10 w-full" /></CardContent></Card>
        </div>
    </div>
);

    const PROPOSAL_STATE_VOTING = 2n;

    export default function ProposalDetailPage() {
        const { t, locale } = useTranslation();
        const { registryAddress, isHydrated } = useWeb3();
        const params = useParams();
        const proposalIdParam = params.id as string;

        // --- State های اصلی ---
        const [offChainData, setOffChainData] = useState<any | null>(null);
        const [error, setError] = useState<string | null>(null);
        const [isLoading, setIsLoading] = useState(true);

        // --- ۱. واکشی داده‌های Off-chain ---
        useEffect(() => {
            if (!proposalIdParam) return;
            setIsLoading(true);
            fetch(`/api/proposals/${proposalIdParam}`)
                .then(res => {
                    if (!res.ok) throw new Error(t('proposal_detail.error_loading_desc'));
                    return res.json();
                })
                .then(apiData => {
                    if (apiData.success) {
                        setOffChainData(apiData.data);
                    } else {
                        throw new Error(apiData.message);
                    }
                })
                .catch(err => setError(err.message))
                // ✅ ما setIsLoading(false) را اینجا قرار نمی‌دهیم تا منتظر داده‌های آن‌چین هم بمانیم
        }, [proposalIdParam, t]);

        // --- ۲. واکشی داده‌های On-chain (فقط اگر پروپوزال آن‌چین شده باشد) ---
        const onChainProposalId = useMemo(() => 
            offChainData?.proposalIdOnChain ? BigInt(offChainData.proposalIdOnChain) : null, [offChainData]);

        const { data: daoAddressResult } = useReadContract({
            address: (registryAddress || undefined) as Address | undefined,
            abi: daoRegistryAbi,
            functionName: 'getAddress',
            args: [REGISTRY_KEYS.DAO] as const,
            query: { enabled: !!registryAddress && isHydrated },
        });
        const daoAddress = daoAddressResult as Address | undefined;

        const { data: onChainResult, isLoading: isOnChainLoading, isSuccess: isOnChainSuccess,error: onChainError } = useReadContract({
            address: daoAddress,
            abi: rayanChainDaoAbi,
            functionName: 'proposals',
            args: [onChainProposalId!],
            query: { enabled: !!daoAddress && !!onChainProposalId },
        });
        
        // --- ترکیب داده‌ها و مدیریت وضعیت Loading ---
        useEffect(() => {
            if (!isLoading) return; // جلوگیری از اجرای مجدد
            
            // اگر هنوز در حال واکشی آف‌چین هستیم، منتظر بمان
            if (!offChainData && !error) return;
            
            // اگر پروپوزال آن‌چین نشده، کار تمام است
            if (!onChainProposalId) {
                setIsLoading(false);
                return;
            }
            
            // اگر پروپوزال آن‌چین شده، منتظر نتیجه آن می‌مانیم
            if (!isOnChainSuccess && !onChainError) return;

            setIsLoading(false);
        }, [offChainData, onChainProposalId, isOnChainSuccess, onChainError, error, isLoading]);


        // --- ۳. پارس کردن امن داده‌های On-chain ---
        const onChainData = useMemo((): OnChainProposal | null => {
            if (!onChainResult || typeof onChainResult !== 'object' || !('id' in onChainResult)) return null;
            const resultAsObject = onChainResult as any;
            return {
                id: resultAsObject.id,
                proposer: resultAsObject.proposer,
                forVotes: resultAsObject.forVotes,
                againstVotes: resultAsObject.againstVotes,
                state: resultAsObject.state,
                deadline: resultAsObject.deadline,
                executed: resultAsObject.executed,
                aiRiskScore: resultAsObject.aiRiskScore,
            };
        }, [onChainResult]);
        
        // --- ۴. منطق رأی‌گیری ---
        const { handleVote, isVotingPending, canVoteFor, canVoteAgainst } = useProposalVote({
            daoAddress,
            proposalId: onChainProposalId!,
            isVotingActive: !!onChainData && onChainData.state === PROPOSAL_STATE_VOTING,
        });

        // --- ۵. رندر کردن UI ---
        if (isLoading) {
            return <AppLayout><SkeletonUI /></AppLayout>;
        }

        if (error || !offChainData) {
            return (
                <AppLayout>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t('proposal_detail.error_loading_title')}</AlertTitle>
                        <AlertDescription>{error || t('proposal_detail.error_loading_desc')}</AlertDescription>
                    </Alert>
                </AppLayout>
            );
        }
    
    // مقادیر پیش‌فرض برای زمانی که پروپوزال هنوز آن‌چین نشده
    const totalVotes = onChainData ? onChainData.forVotes + onChainData.againstVotes : 0n;
    const forPercentage = (onChainData && totalVotes > 0n) ? Number((onChainData.forVotes * 100n) / totalVotes) : 0;
    const { text: statusText, color: statusColor, icon: StatusIcon } = getStatusInfo(onChainData?.state ?? 0n, t);

    return (
        <AppLayout>
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{offChainData.projectName}</h1>
                    <p className="text-muted-foreground mt-1">{offChainData.tagline}</p>
                </div>
                {/* ✅ FIX: نمایش Badge فقط در صورت وجود داده آن‌چین */}
                {onChainData && (
                     <Badge className={`${statusColor} hover:${statusColor} ...`}>
                        <StatusIcon className="w-4 h-4" />
                        <span>{statusText}</span>
                    </Badge>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* کارت تحلیل AI (اکنون امن است) */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit /> {t('proposal_detail.ai_analysis')}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoCard icon={LineChart} title={t('proposal_detail.ai_risk_score')} value={`${onChainData?.aiRiskScore?.toString() ?? 'N/A'}`} />
                            <InfoCard icon={Scale} title={t('proposal_detail.market_sentiment')} value={offChainData.aiAnalysis?.marketSentiment || 'N/A'} />
                            <InfoCard icon={TeamIcon} title={t('proposal_detail.team_competency')} value={offChainData.aiAnalysis?.teamCompetency || 'N/A'} />
                        </CardContent>
                    </Card>

                    {/* سایر کارت‌ها که از offChainData استفاده می‌کنند */}
                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.description')}</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{offChainData.description}</p></CardContent>
                    </Card>

                    {/* کارت رأی‌گیری (فقط زمانی که داده آن‌چین موجود است) */}
                    {onChainData && (
                        <Card>
                            <CardHeader><CardTitle>{t('proposal_detail.voting_results')}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1 text-sm">
                                        <span className="font-medium text-green-600">{t('proposal_detail.votes_for')}</span>
                                        <span>{formatNumber(formatEther(onChainData.forVotes), locale)} ({forPercentage}%)</span>
                                    </div>
                                    <Progress value={forPercentage} className="h-3 [&>*]:bg-green-600" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1 text-sm">
                                        <span className="font-medium text-destructive">{t('proposal_detail.votes_against')}</span>
                                        <span>{formatNumber(formatEther(onChainData.againstVotes), locale)} ({100 - forPercentage}%)</span>
                                    </div>
                                    <Progress value={100 - forPercentage} className="h-3 [&>*]:bg-destructive" />
                                </div>
                            </CardContent>
                            
                            {onChainData.state === PROPOSAL_STATE_VOTING && (
                                <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Button 
                                        size="lg" 
                                        className="bg-green-600 hover:bg-green-700 w-full" 
                                        onClick={() => handleVote('for')} 
                                        disabled={!canVoteFor || isVotingPending}
                                    >
                                        {isVotingPending ? <DaoLoadingSpinner /> : <Check className="me-2"/>}
                                        {t('proposal_detail.vote_for')}
                                    </Button>
                                    <Button 
                                        size="lg" 
                                        variant="destructive" 
                                        className="w-full" 
                                        onClick={() => handleVote('against')} 
                                        disabled={!canVoteAgainst || isVotingPending}
                                    >
                                        {isVotingPending ? <DaoLoadingSpinner /> : <X className="me-2"/>}
                                        {t('proposal_detail.vote_against')}
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    )}
                </div>
                
                <div className="space-y-6">
                    {/* کارت جزئیات (اکنون امن است) */}
                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.details')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <InfoCard icon={User} title={t('proposal_detail.proposer')} value={formatAddress(onChainData?.proposer || offChainData.proposerAddress)} />
                            <InfoCard icon={Banknote} title={t('proposal_detail.amount_requested')} value={`${formatNumber(offChainData.milestones.reduce((acc: number, m: any) => acc + parseFloat(m.amount), 0))} RYC`} />
                            {onChainData && <InfoCard icon={Calendar} title={t('proposal_detail.voting_deadline')} value={formatLocaleDate(new Date(Number(onChainData.deadline) * 1000), locale)} />}
                            {onChainData && <InfoCard icon={Users} title={t('proposal_detail.total_votes')} value={formatNumber(formatEther(totalVotes), locale)} />}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}