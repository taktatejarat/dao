// src/hooks/useProposals.ts (فایل جدید)

import { useState, useEffect } from "react";
import { useTranslation } from "./use-translation";

// تایپ داده‌ها را به اینجا منتقل می‌کنیم تا قابل استفاده مجدد باشد
export interface ProposalListData {
    _id: string;
    proposalIdOnChain: string | null;
    projectName: string;
    tagline: string;
    onChainStatus: string;
}

export function useProposals() {
    console.log("--- HOOK: useProposals is running ---");
    const { t } = useTranslation();
    const [proposals, setProposals] = useState<ProposalListData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

   useEffect(() => {
        console.log("--- HOOK EFFECT: Fetching proposals... (This should run only once) ---");
        
        let isMounted = true; // برای جلوگیری از آپدیت state پس از unmount شدن کامپوننت

        const fetchProposals = async () => {
            try {
                const response = await fetch('/api/proposals');
                if (!isMounted) return; // اگر کامپوننت unmount شده، ادامه نده

                if (!response.ok) {
                    const errorData = await response.json();
                    // ✅ FIX: استفاده از تابع ترجمه در خارج از try/catch برای ثبات
                    throw new Error(errorData.message || "Failed to fetch proposals.");
                }
                
                const data = await response.json();
                if (isMounted) {
                    if (data.success) {
                        // ✅ FIX: مطمئن شوید API شما 'proposals' را برمی‌گرداند یا 'data'
                        setProposals(data.proposals || data.data || []);
                    } else {
                        setError(data.message || "API returned an error.");
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError((err as Error).message);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchProposals();

        // تابع cleanup
        return () => {
            isMounted = false;
        };
        
    // ✅✅✅ THE CRITICAL FIX: آرایه وابستگی خالی ✅✅✅
    // با حذف 't'، این effect فقط یک بار پس از اولین رندر اجرا می‌شود.
    }, []); // <--- آرایه وابستگی خالی است

    return { proposals, isLoading, error };
}