// src/hooks/useProposalHistory.ts

import useSWR from 'swr';
import { useTranslation } from './use-translation';

export interface HistoryEvent {
    id: string;
    type: 'CREATED' | 'STATUS_CHANGE' | 'VOTE' | 'AI_ANALYSIS' | 'EXECUTION' | 'REVISION';
    titleKey: string; // کلید ترجمه برای عنوان
    description?: string;
    timestamp: string;
    txHash?: string;
    metadata?: any; // اطلاعات اضافه مثل مقدار رأی یا امتیاز AI
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useProposalHistory(proposalId: string | undefined) {
    const { t } = useTranslation();

    // فراخوانی API اختصاصی تاریخچه
    const { data, error, isLoading, mutate } = useSWR<{ success: boolean, data: HistoryEvent[] }>(
        proposalId ? `/api/proposals/${proposalId}/history` : null,
        fetcher,
        {
            refreshInterval: 30000, // رفرش هر 30 ثانیه برای زنده بودن لاگ‌ها
        }
    );

    return {
        history: data?.data || [],
        isLoading,
        isError: error,
        refresh: mutate
    };
}