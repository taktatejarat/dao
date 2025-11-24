// src/app/proposals/[id]/page.tsx - FINAL I18N COMPLIANT

"use client";

import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { useWeb3 } from '@/context/Web3Provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrainCircuit, AlertTriangle, Banknote, Calendar, Check, Clock, Info, ShieldCheck, User, Users, X, PlayCircle, CheckCircle, LineChart, Scale, Lock, XCircle } from 'lucide-react';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReadContract } from 'wagmi';
import { rayanChainDaoAbi, stakingAbi } from '@/lib/blockchain/generated';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useProposalVote } from '@/hooks/useProposalVote'; 
import { useProposalExecute } from '@/hooks/useProposalExecute'; 
import { ProposalTimeline } from '@/components/proposals/proposal-timeline';
import { formatEther, type Address, parseAbi } from 'viem';

// --- Type Definitions ---
interface OnChainProposal { 
    id: bigint; 
    proposer: Address; 
    forVotes: bigint; 
    againstVotes: bigint; 
    state: number; 
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

// ✅✅✅ FIX: اصلاح نگاشت بر اساس RayanChainDAO.sol ✅✅✅
// Enum: 0:Pending, 1:Validation, 2:Voting, 3:Approved, 4:Rejected, 5:Executed, 6:Expired, 7:Cancelled
const getStatusInfo = (state: number, t: (key: string) => string) => {
    switch (state) {
        case 0: return { text: t('proposal_detail.status.pending'), color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
        case 1: return { text: t('proposal_detail.status.validation'), color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: ShieldCheck };
        case 2: return { text: t('proposal_detail.status.active'), color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: PlayCircle }; // Voting
        case 3: return { text: t('proposal_detail.status.succeeded'), color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle }; // Approved
        case 4: return { text: t('proposal_detail.status.defeated'), color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle }; // Rejected
        case 5: return { text: t('proposal_detail.status.executed'), color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', icon: ShieldCheck };
        case 6: return { text: t('proposal_detail.status.expired'), color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle };
        case 7: return { text: t('proposal_detail.status.canceled'), color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: X };
        default: return { text: t('proposal_detail.status.unknown'), color: 'bg-gray-500', icon: Info };
    }
};

// ✅ به‌روزرسانی ثابت‌ها برای منطق دکمه‌ها
const PROPOSAL_STATE_ACTIVE = 1;
const PROPOSAL_STATE_VOTING = 2;
const PROPOSAL_STATE_APPROVED = 3;
const PROPOSAL_STATE_SUCCEEDED = 4;
const PROPOSAL_STATE_QUEUED = 5;

export default function ProposalDetailPage() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { daoAddress, tokenAddress,stakingAddress, isHydrated: isWeb3Hydrated, userRole, address } = useWeb3();
    const params = useParams();
    const proposalIdParam = params.id as string;

    const [offChainData, setOffChainData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showStakingAlert, setShowStakingAlert] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!proposalIdParam) { setIsLoading(false); return; }
            setIsLoading(true);
            try {
                const response = await fetch(`/api/proposals/${proposalIdParam}`);
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'Failed.');
                setOffChainData(result.data);
            } catch (err) { setError((err as Error).message); } 
            finally { setIsLoading(false); }
        };
        fetchAllData();
    }, [proposalIdParam]);

    const onChainProposalId = useMemo(() => {
        const raw = offChainData?.proposalIdOnChain;
        if (raw == null) return null;
        try { return BigInt(raw.toString()); } catch { return null; }
    }, [offChainData]);

    const { data: onChainResult, isLoading: isOnChainLoading, error: onChainError } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'proposals',
        args: onChainProposalId ? [onChainProposalId] : undefined,
        query: { enabled: isWeb3Hydrated && !!daoAddress && !!onChainProposalId },
    });

   const { data: userVotingPower } = useReadContract({
        address: stakingAddress, // تغییر به آدرس استیکینگ
        abi: stakingAbi,         // تغییر به ABI استیکینگ
        functionName: 'votingPower', // نام تابع در Staking.sol
        args: address ? [address] : undefined,
        query: { enabled: !!address && !!stakingAddress }
    });

    const onChainData = useMemo((): OnChainProposal | null => {
        if (!onChainResult || !Array.isArray(onChainResult)) return null;
        const result = onChainResult as any[];
        

        // ✅✅✅ DEBUGGER: این خط را در کنسول مرورگر چک کنید ✅✅✅
        console.log("🔍 [Proposal Debug] OnChain Data Array:", result);
        console.log("   - Index 11 (State?):", result[11]);
        console.log("   - Index 12 (Executed?):", result[12]);
        
        return {
            id: result[0],
            proposer: result[2],
            deadline: result[8],
            forVotes: result[9],
            againstVotes: result[10],
            state: Number(result[11]), 
            executed: result[12],
            aiRiskScore: result[14],
        };
    }, [onChainResult]);

    // 4. هوک‌های تعاملی (اصلاح شرط)
    const { handleVote: submitVote, isVotingPending, hasVoted } = useProposalVote({
        daoAddress,
        proposalId: onChainProposalId!,
        // ✅ FIX: استفاده از ثابت صحیح (2)
        isVotingActive: !!onChainData && onChainData.state === PROPOSAL_STATE_VOTING,
    });
    
    const { handleExecute, isExecuting } = useProposalExecute({
        daoAddress,
        proposalId: onChainProposalId!,
        // ✅ FIX: دکمه اجرا فقط وقتی فعال است که وضعیت Approved (3) باشد و هنوز اجرا نشده باشد
        isExecutable: !!onChainData && onChainData.state === PROPOSAL_STATE_APPROVED && !onChainData.executed,
    });

    // ✅✅✅ FIX: دکمه را غیرفعال نمی‌کنیم، بلکه هنگام کلیک چک می‌کنیم
    const handleVoteClick = (voteType: 'for' | 'against') => {
        if (!userVotingPower || userVotingPower === 0n) {
            setShowStakingAlert(true); // نمایش پیام هدایت
            return;
        }
        submitVote(voteType);
    };

    const finalError = error || onChainError?.message;
    if (finalError || (!offChainData && !onChainData && !isLoading && !isOnChainLoading)) {
        return <AppLayout><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('common.error')}</AlertTitle><AlertDescription>{finalError}</AlertDescription></Alert></AppLayout>;
    }
    
    const totalVotes = onChainData ? (BigInt(onChainData.forVotes) + BigInt(onChainData.againstVotes)) : 0n;
    const forPercentage = (onChainData && totalVotes > 0n) ? Number((BigInt(onChainData.forVotes) * 100n) / totalVotes) : 0;
    const { text: statusText, color: statusColor, icon: StatusIcon } = getStatusInfo(onChainData?.state ?? -1, t);

   return (
        <AppLayout>
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-gradient">
                        {offChainData?.projectName ?? (onChainData ? `${t('proposal_detail.proposal')} #${onChainData.id}` : t('common.loading'))}
                    </h1>
                    {offChainData?.tagline && <p className="text-muted-foreground mt-1">{offChainData.tagline}</p>}
                </div>
                <div className="flex items-center gap-4">
                    {offChainData?._id && (<Link href={`/reports?id=${offChainData._id}`} passHref><Button variant="outline"><BrainCircuit className="w-4 h-4 mr-2" />{t('proposal_detail.view_ai_report')}</Button></Link>)}
                    {onChainData && (<Badge variant="outline" className={`${statusColor} text-sm px-3 py-1.5 flex gap-2`}><StatusIcon className="w-4 h-4" /><span>{statusText}</span></Badge>)}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit /> {t('proposal_detail.ai_analysis')}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoCard icon={LineChart} title={t('proposal_detail.ai_risk_score')} value={`${onChainData?.aiRiskScore?.toString() ?? t('common.pending')}`} />
                            <InfoCard icon={Scale} title={t('proposal_detail.market_sentiment')} value={offChainData?.aiAnalysis?.financialAnalysis?.market_sentiment_score ? `${(offChainData.aiAnalysis.financialAnalysis.market_sentiment_score * 100).toFixed(0)}%` : 'N/A'} />
                            <InfoCard icon={Users} title={t('proposal_detail.team_competency')} value={offChainData?.aiAnalysis?.financialAnalysis?.team_competency_score ?? 'N/A'} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.description')}</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{offChainData?.description ?? t('proposal_detail.no_offchain_data')}</p></CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.voting_results')}</CardTitle></CardHeader>
                        <CardContent>
                            {isOnChainLoading ? (
                                <div className="space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
                            ) : onChainData ? (
                                <>
                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1 text-sm"><span className="font-medium text-green-600">{t('proposal_detail.votes_for')}</span><span>{formatNumber(formatEther(onChainData.forVotes), locale)} ({forPercentage}%)</span></div>
                                        <Progress value={forPercentage} className="h-3 [&>*]:bg-green-600" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1 text-sm"><span className="font-medium text-destructive">{t('proposal_detail.votes_against')}</span><span>{formatNumber(formatEther(onChainData.againstVotes), locale)} ({100 - forPercentage}%)</span></div>
                                        <Progress value={100 - forPercentage} className="h-3 [&>*]:bg-destructive" />
                                    </div>
                                    {hasVoted && (<Alert className="mt-6 border-green-500/50 bg-green-500/10"><CheckCircle className="h-4 w-4 text-green-600" /><AlertTitle className="text-green-600">{t('proposal_detail.you_have_voted_title')}</AlertTitle></Alert>)}
                                </>
                            ) : <div className="text-sm text-muted-foreground">{t('proposal_detail.onchain_data_unavailable')}</div>}
                        </CardContent>
                        
                            {/* ✅ FIX: شرط نمایش دکمه‌ها */}
                            {onChainData && onChainData.state === PROPOSAL_STATE_VOTING && !hasVoted && (
                                <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full" onClick={() => handleVoteClick('for')} disabled={isVotingPending}>
                                        {isVotingPending ? <DaoLoadingSpinner /> : <Check className="me-2"/>}{t('proposal_detail.vote_for')}
                                    </Button>
                                    <Button size="lg" variant="destructive" className="w-full" onClick={() => handleVoteClick('against')} disabled={isVotingPending}>
                                        {isVotingPending ? <DaoLoadingSpinner /> : <X className="me-2"/>}{t('proposal_detail.vote_against')}
                                    </Button>
                                </CardFooter>
                            )}
                    </Card>
                </div>
                
                <div className="space-y-6">
                    {onChainData && <ProposalTimeline currentState={BigInt(onChainData.state)} />}
                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.details')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <InfoCard icon={User} title={t('proposal_detail.proposer')} value={formatAddress(onChainData?.proposer || offChainData?.proposerAddress)} />
                            <InfoCard icon={Banknote} title={t('proposal_detail.total_requested')} value={`${formatNumber(offChainData?.milestones.reduce((acc: number, m: any) => acc + parseFloat(m.amount), 0) ?? 0)} RYC`} />
                            {onChainData && <InfoCard icon={Calendar} title={t('proposal_detail.voting_deadline')} value={formatLocaleDate(new Date(Number(onChainData.deadline) * 1000), locale)} />}
                            {onChainData && <InfoCard icon={Users} title={t('proposal_detail.total_votes')} value={formatNumber(formatEther(totalVotes), locale)} />}
                        </CardContent>
                    </Card>
                    {userRole === 'admin' && onChainData && (onChainData.state === PROPOSAL_STATE_SUCCEEDED || onChainData.state === PROPOSAL_STATE_QUEUED) && !onChainData.executed && (
                         <Card className="border-primary"><CardHeader><CardTitle>{t('proposal_detail.admin_actions')}</CardTitle></CardHeader><CardContent><Button className="w-full" onClick={handleExecute} disabled={isExecuting}>{isExecuting ? <DaoLoadingSpinner className="me-2" /> : <PlayCircle className="me-2" />}{t('proposal_detail.execute_proposal')}</Button></CardContent></Card>
                    )}
                </div>
            </div>

            {/* ✅✅✅ پیام هدایت به سپرده‌گذاری با متون i18n ✅✅✅ */}
            <AlertDialog open={showStakingAlert} onOpenChange={setShowStakingAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
                            <Lock className="h-5 w-5" />
                            {t('proposal_detail.alert.insufficient_power_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('proposal_detail.alert.insufficient_power_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('proposal_detail.alert.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push('/staking')}>
                            {t('proposal_detail.alert.go_to_staking')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}