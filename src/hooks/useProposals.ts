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
        console.log("--- HOOK EFFECT: Fetching proposals... ---");
        // این effect فقط یک بار اجرا می‌شود
        
        let isMounted = true;

        const fetchProposals = async () => {
            // ما setIsLoading را در اینجا ریست نمی‌کنیم تا فقط یک بار لودینگ اولیه را ببینیم
            try {
                const response = await fetch('/api/proposals');
                if (!response.ok) throw new Error(t('proposals_page.error_fetching'));
                
                const data = await response.json();
                if (isMounted) {
                    if (data.success) {
                        setProposals(data.proposals);
                    } else {
                        setError(data.message || t('proposals_page.api_error'));
                    }
                }
            } catch (err) {
                if (isMounted) setError((err as Error).message);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchProposals();

        return () => { isMounted = false; };
    }, [t]); // ما t را اینجا نگه می‌داریم، اما چون هوک خارج از کامپوننت است، رفتار متفاوتی خواهد داشت

    return { proposals, isLoading, error };
}