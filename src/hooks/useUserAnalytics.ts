// src/hooks/useUserAnalytics.ts

"use client";

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useProposals } from '@/hooks/useProposals';
import { formatEther } from 'viem';

export function useUserAnalytics() {
    const { address } = useAccount();
    const { proposals, isLoading } = useProposals();

    const stats = useMemo(() => {
        if (!proposals || !address) {
            return {
                totalProposals: 0,
                totalRaised: 0,
                recentStatus: null
            };
        }

        // فیلتر کردن پروپوزال‌های خود کاربر
        const myProposals = proposals.filter(
            (p: any) => p.proposerAddress?.toLowerCase() === address.toLowerCase()
        );

        // محاسبه مجموع سرمایه جذب شده (فقط پروپوزال‌های اجرا شده یا موفق)
        // نکته: اینجا فرض می‌کنیم amount در دیتابیس ذخیره شده. اگر نه، باید از آن‌چین خوانده شود.
        // فعلا بر اساس milestone ها جمع می‌زنیم
        const totalRaisedRaw = myProposals.reduce((acc: number, p: any) => {
            if (['executed', 'approved'].includes(p.onChainStatus)) {
                const proposalTotal = p.milestones?.reduce((sum: number, m: any) => sum + Number(m.amount || 0), 0) || 0;
                return acc + proposalTotal;
            }
            return acc;
        }, 0);

        // وضعیت آخرین پروپوزال
        const lastProposal = myProposals.length > 0 ? myProposals[0] : null; // فرض بر اینکه لیست مرتب شده است

        return {
            totalProposals: myProposals.length,
            totalRaised: totalRaisedRaw,
            recentStatus: lastProposal ? lastProposal.onChainStatus : null,
            lastProposalId: lastProposal ? lastProposal._id : null
        };

    }, [proposals, address]);

    return {
        ...stats,
        isLoading
    };
}