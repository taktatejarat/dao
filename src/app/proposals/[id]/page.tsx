// src/app/proposals/[id]/page.tsx - STABLE & COMPLETE VERSION

"use client";

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { AppLayout } from '@/components/layout/app-layout';
import { useWeb3 } from '@/context/Web3Provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
    BrainCircuit, AlertTriangle, Banknote, Calendar, Check, Clock, ShieldCheck, 
    User, Users, X, PlayCircle, CheckCircle, LineChart, XCircle, TrendingUp, 
    Wallet, Info, Hash, Lock, RefreshCw, Edit
} from 'lucide-react';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReadContract, useWriteContract } from 'wagmi';
import { rayanChainDaoAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useProposalVote } from '@/hooks/useProposalVote'; 
import { useProposalExecute } from '@/hooks/useProposalExecute'; 
import { ProposalTimeline } from '@/components/proposals/proposal-timeline';
import { formatEther, type Address, parseAbi, parseEther } from 'viem';
import { useMilestoneRelease } from '@/hooks/useMilestoneRelease';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress"; 
import { Input } from "@/components/ui/input"; 
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/stat-card';
import { ProposalHistory } from '@/components/proposals/proposal-history';

// --- Constants & ABIs ---
const VOTING_POWER_ABI = parseAbi(['function votingPower(address account) view returns (uint256)']);
const INVEST_ABI = parseAbi(['function invest(uint256 _proposalId, uint256 _amount) external']);
const REFUND_ABI = parseAbi(['function claimRefund(uint256 _proposalId) external']);

// Contract States
const STATE_PENDING = 0;
const STATE_ACTIVE = 1; // Validation
const STATE_VOTING = 2;
const STATE_SUCCEEDED = 3; // Approved
const STATE_DEFEATED = 4;
const STATE_EXECUTED = 5;
const STATE_EXPIRED = 6;
const STATE_CANCELED = 7;
const STATE_FUNDING = 8;
const STATE_FUNDED = 9;
const STATE_FUNDING_FAILED = 10;

interface OnChainProposal { 
    id: bigint; proposer: Address; amount: bigint; deadline: bigint; 
    forVotes: bigint; againstVotes: bigint; state: number; executed: boolean; 
    aiRiskScore: bigint; totalRaised: bigint; fundingDeadline: bigint;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProposalDetailPage() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { daoAddress, tokenAddress, stakingAddress, isHydrated, userRole, address } = useWeb3();
    const params = useParams();
    const proposalIdParam = params.id as string;

    const [showStakingAlert, setShowStakingAlert] = useState(false);
    const [proofText, setProofText] = useState("");
    const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
    const [investAmount, setInvestAmount] = useState("");

    // --- 1. Fetch Off-Chain Data (SWR) ---
    const { data: apiResponse, error: apiError, mutate } = useSWR(
        proposalIdParam ? `/api/proposals/${proposalIdParam}` : null,
        fetcher,
        { 
            refreshInterval: 5000, // هر 5 ثانیه وضعیت را چک کن (برای سینک شدن با ناظر)
            revalidateOnFocus: true 
        }
    );
    const offChainData = apiResponse?.data;

    // --- 2. Prepare On-Chain ID ---
    const onChainProposalId = useMemo(() => {
        if (!offChainData?.proposalIdOnChain) return null;
        try { return BigInt(offChainData.proposalIdOnChain); } catch { return null; }
    }, [offChainData]);

    const contractReadArgs = useMemo(() => 
        onChainProposalId ? ([onChainProposalId] as const) : undefined
    , [onChainProposalId]);

    // --- 3. Fetch On-Chain Data (Wagmi) ---
    const { data: onChainResult, isLoading: isOnChainLoading, error: onChainError } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'proposals',
        args: contractReadArgs,
        query: { enabled: isHydrated && !!daoAddress && !!onChainProposalId },
    });

    const votingPowerArgs = useMemo(() => address ? ([address] as const) : undefined, [address]);
    const { data: userVotingPower } = useReadContract({
        address: stakingAddress, abi: VOTING_POWER_ABI, functionName: 'votingPower', args: votingPowerArgs,
        query: { enabled: !!address && !!stakingAddress }
    });

    const { data: tokenTotalSupply } = useReadContract({
        address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'totalSupply',
        query: { enabled: !!tokenAddress }
    });

    // --- 4. Parse On-Chain Data Safely ---
    const onChainData = useMemo((): OnChainProposal | null => {
        if (!onChainResult) return null;
        
        // Handle Array return (Classic Solidity)
        if (Array.isArray(onChainResult)) {
            const r = onChainResult as any[];
            return {
                id: r[0], proposer: r[2], amount: r[5], deadline: r[8],
                forVotes: r[9], againstVotes: r[10], state: Number(r[11]), 
                executed: r[12], aiRiskScore: r[14], totalRaised: r[17] || 0n, 
                fundingDeadline: r[19] || 0n 
            };
        }
        // Handle Object return (Viem/Wagmi Typed)
        if (typeof onChainResult === 'object') {
            const r = onChainResult as any;
            return {
                id: r.id, proposer: r.proposer, amount: r.amount, deadline: r.votingDeadline || r.deadline,
                forVotes: r.forVotes, againstVotes: r.againstVotes, state: Number(r.state),
                executed: r.executed, aiRiskScore: r.aiRiskScore, totalRaised: r.totalRaised || 0n,
                fundingDeadline: r.fundingDeadline || 0n
            };
        }
        return null;
    }, [onChainResult]);

    // --- 5. Smart Status Logic ---
    const smartStatus = useMemo(() => {
        // Fallback to DB status if Observer marked it defeated but Chain is laggy
        if (offChainData?.onChainStatus === 'defeated') {
            return { state: STATE_DEFEATED, label: t('proposal_detail.status.defeated'), color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle };
        }

        if (onChainData) {
            const now = Date.now() / 1000;
            const state = onChainData.state;

            // Check Expiry Logic (Client Side Override)
            if (state === STATE_VOTING && now > Number(onChainData.deadline)) {
                if (onChainData.forVotes > onChainData.againstVotes) {
                    return { state: STATE_SUCCEEDED, label: t('proposal_detail.status.processing'), color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Clock };
                } else {
                    return { state: STATE_DEFEATED, label: t('proposal_detail.status.defeated'), color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle };
                }
            }

            switch (state) {
                case STATE_PENDING: return { state, label: t('proposal_detail.status.pending'), color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
                case STATE_ACTIVE: return { state, label: t('proposal_detail.status.validation'), color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: ShieldCheck };
                case STATE_VOTING: return { state, label: t('proposal_detail.status.active'), color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: PlayCircle }; 
                case STATE_SUCCEEDED: return { state, label: t('proposal_detail.status.succeeded'), color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle }; 
                case STATE_DEFEATED: return { state, label: t('proposal_detail.status.defeated'), color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle }; 
                case STATE_EXECUTED: return { state, label: t('proposal_detail.status.executed'), color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', icon: ShieldCheck };
                case STATE_FUNDING: return { state, label: t('proposal_detail.status.funding'), color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', icon: Banknote };
                case STATE_FUNDED: return { state, label: t('proposal_detail.status.funded'), color: 'bg-teal-500/10 text-teal-500 border-teal-500/20', icon: CheckCircle };
                case STATE_FUNDING_FAILED: return { state, label: t('proposal_detail.status.funding_failed'), color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: AlertTriangle };
                default: return { state, label: t('proposal_detail.status.unknown'), color: 'bg-gray-500', icon: Info };
            }
        }
        
        // If loading or no data
        return { state: -1, label: t('common.loading'), color: 'bg-gray-100 text-gray-500', icon: Info };
    }, [onChainData, offChainData, t]);

    // --- 6. AI Metrics Logic (Fixed Nested Access) ---
    const aiMetrics = useMemo(() => {
        if (!offChainData?.aiAnalysis) return { marketScore: t('common.na'), teamScore: t('common.na') };
        
        // Try multiple paths to find data
        const ai = offChainData.aiAnalysis;
        const fin = ai.financialAnalysis || {};
        
        const market = ai.market_sentiment_score ?? fin.market_sentiment_score ?? 0;
        const team = ai.team_competency_score ?? fin.team_competency_score ?? 0;

        return {
            marketScore: market ? `${(market * 100).toFixed(0)}%` : t('common.na'),
            teamScore: team ? `${team}%` : t('common.na')
        };
    }, [offChainData, t]);

    // --- 7. Contract Actions ---
    const { writeContractAsync: investAsync } = useWriteContract();
    const handleInvest = async () => {
        if (!daoAddress || !onChainProposalId) return;
        const tid = toast.loading(t('toasts.processing_investment'));
        try {
            await investAsync({
                address: daoAddress, abi: INVEST_ABI, functionName: 'invest',
                args: [onChainProposalId, parseEther(investAmount)]
            });
            toast.success(t('toasts.investment_submitted'), { id: tid });
            setInvestAmount("");
        } catch (e) { toast.error(t('toasts.investment_failed'), { id: tid }); }
    };

    const { writeContractAsync: refundAsync } = useWriteContract();
    const handleRefund = async () => {
        if (!daoAddress || !onChainProposalId) return;
        const tid = toast.loading(t('toasts.processing_refund'));
        try {
            await refundAsync({
                address: daoAddress, abi: REFUND_ABI, functionName: 'claimRefund',
                args: [onChainProposalId]
            });
            toast.success(t('toasts.refund_claimed'), { id: tid });
        } catch (e) { toast.error(t('toasts.refund_failed'), { id: tid }); }
    };

    const { requestRelease, isreleasing } = useMilestoneRelease({ daoAddress, originalProposalId: onChainProposalId || 0n });

    const isVotingAllowed = useMemo(() => {
        if (!onChainData) return false;
        const now = Date.now() / 1000;
        return onChainData.state === STATE_VOTING && now <= Number(onChainData.deadline);
    }, [onChainData]);

    const { handleVote: submitVote, isVotingPending, hasVoted } = useProposalVote({
        daoAddress, proposalId: onChainProposalId!, isVotingActive: isVotingAllowed
    });
    
    const { handleExecute, isExecuting } = useProposalExecute({
        daoAddress, proposalId: onChainProposalId!,
        isExecutable: !!onChainData && onChainData.state === STATE_SUCCEEDED && !onChainData.executed
    });

    const handleVoteClick = (voteType: 'for' | 'against') => {
        if (!userVotingPower || userVotingPower === 0n) { setShowStakingAlert(true); return; }
        submitVote(voteType);
    };

    // --- 8. Render Preparation ---
    const isOwner = address && offChainData && (address.toLowerCase() === offChainData.proposerAddress?.toLowerCase());
    const finalError = onChainError?.message;
    
    // Fallback data for rendering if onChain is missing but DB says defeated
    const displayData = onChainData || (offChainData?.onChainStatus === 'defeated' ? {
        id: BigInt(offChainData.proposalIdOnChain || 0),
        forVotes: 0n, againstVotes: 0n, deadline: 0n, state: STATE_DEFEATED, aiRiskScore: BigInt(offChainData.aiAnalysis?.risk_score || 0)
    } as any : null);

    if (finalError) return <AppLayout><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('common.error')}</AlertTitle><AlertDescription>{finalError}</AlertDescription></Alert></AppLayout>;

    const networkTotal = tokenTotalSupply ? BigInt(tokenTotalSupply.toString()) : 0n;
    const forVotesBig = displayData ? BigInt(displayData.forVotes || 0) : 0n;
    const againstVotesBig = displayData ? BigInt(displayData.againstVotes || 0) : 0n;

    let forPct = 0, againstPct = 0;
    if (networkTotal > 0n) {
        forPct = Number((forVotesBig * 10000n) / networkTotal) / 100;
        againstPct = Number((againstVotesBig * 10000n) / networkTotal) / 100;
    }
    const totalRequested = (offChainData?.milestones || []).reduce((acc: number, m: any) => acc + (parseFloat(m.amount) || 0), 0);

    return (
        <AppLayout>
            {/* Header */}
            <header className="mb-10 bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><BrainCircuit className="w-64 h-64" /></div>
                <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/proposals"><Button variant="ghost" size="sm" className="text-muted-foreground">← {t('dashboard.view_all')}</Button></Link>
                            <Badge variant="secondary" className="px-3 py-1.5 font-mono"><Hash className="w-3.5 h-3.5 text-muted-foreground mr-1" />{displayData ? displayData.id.toString() : "..."}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className={`${smartStatus.color} px-4 py-1.5 text-sm font-medium flex items-center gap-2 border-2`}>
                                <smartStatus.icon className="w-4 h-4" />
                                <span>{smartStatus.label}</span>
                            </Badge>
                            {offChainData?._id && <Link href={`/reports?id=${offChainData._id}`}><Button variant="outline" size="sm" className="gap-2"><BrainCircuit className="w-4 h-4" />{t('proposal_detail.view_ai_report')}</Button></Link>}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold font-headline text-gradient">{offChainData?.projectName ?? t('common.loading')}</h1>
                        <p className="text-lg text-muted-foreground">{offChainData?.tagline}</p>
                    </div>
                </div>
            </header>

            {/* Voting Expired Warning */}
            {!isVotingAllowed && onChainData?.state === STATE_VOTING && smartStatus.state !== STATE_DEFEATED && (
                <Alert className="mb-8 border-orange-500/50 bg-orange-500/10"><Clock className="h-5 w-5 text-orange-600" /><AlertTitle className="text-orange-600">{t('proposal_detail.alert.deadline_passed_title')}</AlertTitle><AlertDescription>{t('proposal_detail.alert.deadline_passed_desc')}</AlertDescription></Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard title={t('proposal_detail.ai_risk_score')} value={displayData?.aiRiskScore?.toString() ?? "..."} icon={LineChart} variant="default" isLoading={isOnChainLoading && !displayData} />
                        <StatCard title={t('proposal_detail.market_sentiment')} value={aiMetrics.marketScore} icon={TrendingUp} variant="positive" isLoading={!offChainData} />
                        <StatCard title={t('proposal_detail.team_competency')} value={aiMetrics.teamScore} icon={Users} variant="neutral" isLoading={!offChainData} />
                    </div>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><BrainCircuit className="w-6 h-6 text-muted-foreground"/> {t('proposal_detail.description')}</CardTitle></CardHeader>
                        <CardContent><p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{offChainData?.description ?? t('proposal_detail.no_offchain_data')}</p></CardContent>
                    </Card>

                    {/* Voting Results */}
                    <Card>
                        <CardHeader><CardTitle className="flex justify-between"><span>{t('proposal_detail.voting_results')}</span><Badge variant="secondary">{t('common.quorum')}: 4%</Badge></CardTitle></CardHeader>
                        <CardContent>
                            {displayData ? (
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between mb-2 text-base"><span className="text-green-600 flex items-center gap-2"><CheckCircle className="w-5 h-5" />{t('proposal_detail.votes_for')}</span><span>{formatNumber(formatEther(forVotesBig), locale)} RYC</span></div>
                                        <Progress value={Math.max(forPct, 1)} className="h-4 bg-green-100 dark:bg-green-950 [&>div]:bg-green-600" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2 text-base"><span className="text-destructive flex gap-2"><XCircle className="w-5 h-5" />{t('proposal_detail.votes_against')}</span><span>{formatNumber(formatEther(againstVotesBig), locale)} RYC</span></div>
                                        <Progress value={Math.max(againstPct, 1)} className="h-4 bg-red-100 dark:bg-red-950 [&>div]:bg-destructive" />
                                    </div>
                                    {hasVoted && <Alert className="mt-6 border-green-500/50 bg-green-500/10"><CheckCircle className="h-5 w-5 text-green-600" /><AlertTitle className="text-green-600">{t('proposal_detail.you_have_voted_title')}</AlertTitle></Alert>}
                                </div>
                            ) : (
                                <div className="space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
                            )}
                        </CardContent>
                        
                        {isVotingAllowed && !hasVoted && (
                            <CardFooter className="grid grid-cols-2 gap-4 pt-2">
                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleVoteClick('for')} disabled={isVotingPending}><Check className="me-2"/>{t('proposal_detail.vote_for')}</Button>
                                <Button variant="destructive" onClick={() => handleVoteClick('against')} disabled={isVotingPending}><X className="me-2"/>{t('proposal_detail.vote_against')}</Button>
                            </CardFooter>
                        )}
                        {!isVotingAllowed && onChainData?.state === STATE_VOTING && <CardFooter><Button variant="secondary" className="w-full" disabled>{t('proposal_detail.voting_ended')}</Button></CardFooter>}
                    </Card>

                    {/* Funding / Refund */}
                    {(smartStatus.state === STATE_FUNDING) && (
                        <Card className="border-primary/50 shadow-lg"><CardHeader><CardTitle className="text-primary flex gap-2"><Banknote/> {t('proposal_detail.funding_in_progress')}</CardTitle></CardHeader><CardContent className="space-y-6"><div className="space-y-2"><div className="flex justify-between text-sm font-medium"><span>{t('proposal_detail.raised')}: {formatEther(onChainData?.totalRaised || 0n)} RYC</span><span>{t('proposal_detail.goal')}: {formatEther(onChainData?.amount || 0n)} RYC</span></div><Progress value={Number((onChainData?.totalRaised || 0n) * 100n / (onChainData?.amount || 1n))} className="h-4" /></div><div className="flex gap-4 items-end"><div className="space-y-2 flex-1"><label className="text-xs font-medium text-muted-foreground">{t('proposal_detail.investment_amount')}</label><Input type="number" placeholder="0.0" value={investAmount} onChange={e => setInvestAmount(e.target.value)} /></div><Button onClick={handleInvest} className="bg-primary min-w-[120px]">{t('proposal_detail.invest_now')}</Button></div></CardContent></Card>
                    )}

                    {(smartStatus.state === STATE_FUNDING_FAILED) && (
                        <Card className="border-destructive/50 bg-destructive/5"><CardHeader><CardTitle className="text-destructive flex gap-2"><AlertTriangle /> {t('proposal_detail.funding_failed_title')}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground mb-4">{t('proposal_detail.funding_failed_desc')}</p><Button variant="destructive" onClick={handleRefund}>{t('proposal_detail.claim_refund')}</Button></CardContent></Card>
                    )}

                    {/* Milestone */}
                    {isOwner && smartStatus.state === STATE_FUNDED && (
                        <Card className="border-blue-500/50 bg-blue-500/5"><CardHeader><CardTitle className="text-blue-600 flex gap-2"><Banknote/> {t('proposal_detail.milestone_management')}</CardTitle></CardHeader><CardContent><Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}><DialogTrigger asChild><Button className="w-full bg-blue-600 hover:bg-blue-700">{t('proposal_detail.request_next_milestone')}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t('proposal_detail.submit_progress_report')}</DialogTitle></DialogHeader><div className="space-y-4 py-4"><Textarea placeholder={t('proposal_detail.progress_placeholder')} value={proofText} onChange={(e) => setProofText(e.target.value)} className="min-h-[120px]"/><Button onClick={() => { requestRelease(proofText); setIsReleaseDialogOpen(false); }} disabled={isreleasing || !proofText} className="w-full">{isreleasing ? <DaoLoadingSpinner /> : t('proposal_detail.submit_request')}</Button></div></DialogContent></Dialog></CardContent></Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <ProposalTimeline currentState={BigInt(smartStatus.state === -1 ? (onChainData?.state || 0) : smartStatus.state)} />
                    
                    <div className="space-y-4">
                        <StatCard title={t('proposal_detail.proposer')} value={formatAddress(displayData?.proposer || offChainData?.proposerAddress)} icon={User} variant="neutral" description={t('proposal_detail.project_lead')} />
                        <StatCard title={t('proposal_detail.total_requested')} value={`${formatNumber(totalRequested)} RYC`} icon={Wallet} variant="warning" />
                        {displayData?.deadline && <StatCard title={t('proposal_detail.voting_deadline')} value={formatLocaleDate(new Date(Number(displayData.deadline) * 1000), locale)} icon={Calendar} variant="neutral" />}
                        {displayData && <StatCard title={t('proposal_detail.total_votes')} value={formatNumber(formatEther(BigInt(displayData.forVotes || 0) + BigInt(displayData.againstVotes || 0)), locale)} icon={Users} variant="default" />}
                    </div>

                    {/* Resubmit Card (For Owner + Defeated/Expired) */}
                    {isOwner && (smartStatus.state === STATE_DEFEATED || smartStatus.state === STATE_EXPIRED || smartStatus.state === STATE_FUNDING_FAILED) && (
                        <Card className="border-amber-500/50 bg-amber-500/5 mt-6"><CardHeader><CardTitle className="text-amber-600 flex items-center gap-2 text-lg"><RefreshCw className="w-5 h-5" /> {t('proposal_detail.resubmit_title')}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground mb-4">{t('proposal_detail.resubmit_desc')}</p><Link href={`/proposals/new?clone=${offChainData?._id}`}><Button className="w-full bg-amber-600 hover:bg-amber-700"><Edit className="w-4 h-4 me-2" />{t('proposal_detail.btn_resubmit')}</Button></Link></CardContent></Card>
                    )}

                    {offChainData?._id && <ProposalHistory proposalId={offChainData._id} />}
                    
                    {userRole === 'admin' && smartStatus.state === STATE_SUCCEEDED && !onChainData?.executed && (
                         <Card className="border-primary border-dashed bg-primary/5"><CardContent className="pt-6"><Button className="w-full" onClick={handleExecute} disabled={isExecuting}><PlayCircle className="me-2" />{t('proposal_detail.execute_proposal')}</Button></CardContent></Card>
                    )}
                </div>
            </div>

            <AlertDialog open={showStakingAlert} onOpenChange={setShowStakingAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{t('proposal_detail.alert.insufficient_power_title')}</AlertDialogTitle><AlertDialogDescription>{t('proposal_detail.alert.insufficient_power_desc')}</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>{t('proposal_detail.alert.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => router.push('/staking')}>{t('proposal_detail.alert.go_to_staking')}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}