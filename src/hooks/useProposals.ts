// src/hooks/useProposals.ts (فایل جدید)

import { useTranslation } from "./use-translation";
import useSWR from 'swr';

// تایپ داده‌ها را به اینجا منتقل می‌کنیم تا قابل استفاده مجدد باشد
export interface ProposalListData {
    _id: string;
    proposalIdOnChain: string | null;
    projectName: string;
    tagline: string;
    onChainStatus: string;
}

// ✅ 1. تعریف یک تابع fetcher عمومی
// SWR از این تابع برای تمام درخواست‌های fetch استفاده خواهد کرد.
const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred while fetching the data.');
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || 'API returned a non-success response.');
    }
    // ✅ FIX: مطمئن شوید API شما 'proposals' یا 'data' را برمی‌گرداند
    return data.proposals || data.data || [];
};

export function useProposals() {
    const { t } = useTranslation();
    
    // ✅✅✅ THE CRITICAL FIX: جایگزینی کل useEffect با یک خط کد SWR ✅✅✅
    const { data: proposals, error, isLoading, mutate } = useSWR<ProposalListData[]>(
        '/api/proposals', // کلید منحصر به فرد (URL)
        fetcher,          // تابع واکشی داده
        {
            // گزینه‌های اختیاری برای بهبود تجربه کاربری
            revalidateOnFocus: true, // وقتی کاربر به تب برمی‌گردد، داده‌ها را به‌روز کن
            revalidateOnReconnect: true, // وقتی اتصال اینترنت برقرار می‌شود، به‌روز کن
            onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
                // پس از ۳ بار تلاش، دیگر تلاش نکن
                if (retryCount >= 2) return;
                // پس از ۵ ثانیه دوباره تلاش کن
                setTimeout(() => revalidate({ retryCount }), 5000);
            },
        }
    );

    return {
        proposals: proposals || [], // در حالت اولیه، یک آرایه خالی برگردان
        isLoading,
        error: error ? error.message : null,
        // ✅ NEW: تابع mutate برای به‌روزرسانی دستی داده‌ها
        // این تابع بسیار قدرتمند است و به شما اجازه می‌دهد تا پس از یک عمل (مثلاً ثبت پروپوزال)،
        // لیست را بدون نیاز به رفرش کامل صفحه، به‌روز کنید.
        refreshProposals: mutate,
    };
}