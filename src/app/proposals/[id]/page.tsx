// src/app/proposals/[id]/page.tsx - FINAL, ERROR-FREE AND DEADLOCK-FREE VERSION

"use client";

import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { useWeb3 } from '@/context/Web3Provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BrainCircuit, AlertTriangle, 
        Banknote, Calendar, Check, Clock, Info, 
        ShieldCheck, User, Users, X, LineChart, Scale } from 'lucide-react';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { formatEther, type Address } from 'viem';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReadContract } from 'wagmi';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useProposalVote } from '@/hooks/useProposalVote';

// --- Type Definitions and Helper Components ---
interface OnChainProposal { id: bigint; proposer: Address; forVotes: bigint; againstVotes: bigint; state: bigint; deadline: bigint; executed: boolean; aiRiskScore: bigint; }

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
    const { daoAddress, isHydrated: isWeb3Hydrated } = useWeb3();
    const params = useParams();
    const proposalIdParam = params.id as string;

    // --- State های اصلی ---
    const [offChainData, setOffChainData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFetchingOffChain, setIsFetchingOffChain] = useState(true);

    const onChainProposalId = useMemo(() =>
        offChainData?.proposalIdOnChain ? BigInt(offChainData.proposalIdOnChain) : null,
        [offChainData]
    );

     // --- ۱. واکشی داده‌های Off-chain ---
    useEffect(() => {
        if (!proposalIdParam) {
            setIsFetchingOffChain(false);
            return;
        }
        
        let isMounted = true;
        setIsFetchingOffChain(true);
        setError(null);

        const fetchOffChainData = async () => {
            try {
                const response = await fetch(`/api/proposals/${proposalIdParam}`);
                if (!isMounted) return;

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch proposal details.");
                }

                if (data.success) {
                    setOffChainData(data.data);
                } else {
                    throw new Error(data.message);
                }
            } catch (err) {
                if (isMounted) setError((err as Error).message);
            } finally {
                if (isMounted) setIsFetchingOffChain(false);
            }
        };

        fetchOffChainData();

        return () => { isMounted = false; };

    }, [proposalIdParam]);

    // --- ۲. واکشی داده‌های On-chain ---
    const { data: onChainResult, isLoading: isOnChainLoading, error: onChainError } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'proposals',
        args: [onChainProposalId!],
        query: {
            enabled: isWeb3Hydrated && !!daoAddress && !!onChainProposalId,
        },
    });

    // --- ۳. پارس کردن داده‌های On-chain ---
    const onChainData = useMemo((): OnChainProposal | null => {
        if (!onChainResult || typeof onChainResult !== 'object' || !('id' in onChainResult)) return null;
        return onChainResult as any;
    }, [onChainResult]);

    // --- ۴. منطق رأی‌گیری ---
    const { handleVote, isVotingPending, canVoteFor, canVoteAgainst } = useProposalVote({
        daoAddress,
        proposalId: onChainProposalId!,
        isVotingActive: !!onChainData && onChainData.state === PROPOSAL_STATE_VOTING,
    });

    // ✅✅✅ THE FIX IS HERE: حذف تعریف‌های تکراری و استفاده از متغیر صحیح ✅✅✅
    const isLoading = isFetchingOffChain || (isWeb3Hydrated && !!onChainProposalId && isOnChainLoading);

    // --- ۵. رندر کردن UI ---
    if (isLoading) {
        return <AppLayout><SkeletonUI /></AppLayout>;
    }

    // ✅ FIX: ترکیب `error` و `onChainError` برای نمایش خطای جامع
    const finalError = error || onChainError?.message;
    if (finalError || !offChainData) {
        return (
            <AppLayout>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('proposal_detail.error_loading_title')}</AlertTitle>
                    <AlertDescription>{finalError || t('proposal_detail.error_loading_desc')}</AlertDescription>
                </Alert>
            </AppLayout>
        );
    }
    
    const totalVotes = onChainData ? onChainData.forVotes + onChainData.againstVotes : 0n;
    const forPercentage = (onChainData && totalVotes > 0n) ? Number((onChainData.forVotes * 100n) / totalVotes) : 0;
    const { text: statusText, color: statusColor, icon: StatusIcon } = getStatusInfo(onChainData?.state ?? 0n, t);

    return (
        <AppLayout>
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-gradient">{offChainData.projectName}</h1>
                    <p className="text-muted-foreground mt-1">{offChainData.tagline}</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* ✅✅✅ THE CRITICAL FIX IS HERE ✅✅✅ */}
                    {/* ما فقط زمانی دکمه را رندر می‌کنیم که شناسه آف-چین موجود باشد */}
                    {offChainData?._id && (
                        <Link href={`/reports?id=${offChainData._id}`} passHref>
                            <Button variant="outline">
                                <BrainCircuit className="w-4 h-4 mr-2" />
                                {t('proposal_detail.view_ai_report')}
                            </Button>
                        </Link>
                    )}
                    
                    {onChainData && (
                        <Badge className={`${statusColor} hover:${statusColor} text-sm px-3 py-1.5`}>
                            <StatusIcon className="w-4 h-4 mr-2" />
                            <span>{statusText}</span>
                        </Badge>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* کارت تحلیل AI (اکنون امن است) */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit /> {t('proposal_detail.ai_analysis')}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoCard icon={LineChart} title={t('proposal_detail.ai_risk_score')} value={`${onChainData?.aiRiskScore?.toString() ?? 'N/A'}`} />
                            <InfoCard icon={Scale} title={t('proposal_detail.market_sentiment')} value={offChainData.aiAnalysis?.marketSentiment || 'N/A'} />
                            <InfoCard icon={Users} title={t('proposal_detail.team_competency')} value={offChainData.aiAnalysis?.teamCompetency || 'N/A'} />
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
                            <InfoCard icon={Banknote} title={t('proposal_detail.total_requested')} value={`${formatNumber(offChainData.milestones.reduce((acc: number, m: any) => acc + parseFloat(m.amount), 0))} RYC`} />
                            {onChainData && <InfoCard icon={Calendar} title={t('proposal_detail.voting_deadline')} value={formatLocaleDate(new Date(Number(onChainData.deadline) * 1000), locale)} />}
                            {onChainData && <InfoCard icon={Users} title={t('proposal_detail.total_votes')} value={formatNumber(formatEther(totalVotes), locale)} />}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function setIsFetchingOffChain(arg0: boolean) {
    throw new Error('Function not implemented.');
}
