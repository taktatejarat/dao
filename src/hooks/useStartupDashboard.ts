// src/hooks/useStartupDashboard.ts - NEW SPECIALIZED HOOK

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

// تایپ داده‌ای که از API پروپوزال‌ها می‌آید
interface ProposalSummary {
    _id: string;
    proposalIdOnChain?: string;
    projectName: string;
    status: string; // وضعیت در دیتابیس
    onChainStatus?: string; // وضعیت واقعی در بلاکچین
    totalRaised?: string; // اگر در مرحله فاندینگ باشد
}

export function useStartupDashboard() {
    const { address, isConnected } = useAccount();

    // دریافت لیست پروپوزال‌های خودم از API (سریعتر از خواندن تک تک پروپوزال‌ها از بلاکچین)
    const { data: myProposals, isLoading, error } = useQuery<ProposalSummary[]>({
        queryKey: ['startup-proposals', address],
        queryFn: async () => {
            if (!address) return [];
            // فرض بر این است که API شما قابلیت فیلتر بر اساس proposer را دارد
            const res = await fetch(`/api/proposals?proposer=${address}`); 
            if (!res.ok) throw new Error('Failed to fetch proposals');
            const json = await res.json();
            return json.data || []; // بسته به ساختار ریسپانس شما
        },
        enabled: isConnected && !!address,
        staleTime: 30000 // ۳۰ ثانیه کش
    });

    // محاسبات آماری روی کلاینت (بدون نیاز به درخواست اضافه)
    const stats = useQuery({
        queryKey: ['startup-stats', myProposals],
        queryFn: () => {
            if (!myProposals) return null;
            
            const active = myProposals.filter(p => ['voting', 'active', 'funding'].includes(p.status)).length;
            const funded = myProposals.filter(p => p.status === 'funded' || p.status === 'executed').length;
            // جمع زدن سرمایه جذب شده (نیاز است فیلد amount در API باشد، فعلا فرض می‌کنیم تعداد موفق‌ها مدنظر است)
            
            return {
                totalProposals: myProposals.length,
                activeProposals: active,
                successfulProjects: funded,
                latestProposal: myProposals[0] || null // فرض بر این است که API مرتب شده برمی‌گرداند
            };
        },
        enabled: !!myProposals
    });

    return {
        proposals: myProposals,
        stats: stats.data,
        isLoading: isLoading || stats.isLoading,
        error
    };
}