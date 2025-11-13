// src/components/dashboard/proposal-item.tsx (نسخه نهایی و ساده شده)
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ProposalListData } from '@/hooks/useProposals'; 


interface ProposalItemProps {
    proposalData: ProposalListData;
}

// تابع کمکی برای تعیین استایل Badge بر اساس وضعیت
const getStatusBadgeVariant = (status: string): "secondary" | "default" | "outline" | "destructive" | "success" => {
    switch (status) {
        case 'pending_submission':
            return 'secondary';
        case 'confirmed':
        case 'voting':
            return 'default'; // برای "در حال رای‌گیری" از رنگ اصلی استفاده می‌کنیم
        case 'approved':
        case 'executed':
            return 'success';
        case 'rejected':
        case 'cancelled':
            return 'destructive';
        default:
            return 'outline';
    }
}

export function ProposalItem({ proposalData }: ProposalItemProps) {
    const { t } = useTranslation();

    // شناسه برای لینک می‌تواند شناسه آن‌چین (اگر موجود بود) یا شناسه MongoDB باشد
    const linkId = proposalData.proposalIdOnChain || proposalData._id;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b last:border-b-0">
            <div className="flex-1 mb-4 sm:mb-0">
                <p className="font-medium font-headline text-lg">{proposalData.projectName}</p>
                <p className="text-sm text-muted-foreground">{proposalData.tagline}</p>
                <div className="flex items-center gap-4 mt-2">
                    <Badge variant={getStatusBadgeVariant(proposalData.onChainStatus)}>
                        {/* کلید ترجمه باید با مقادیر onChainStatus شما مطابقت داشته باشد */}
                        {t(`proposals_page.status.${proposalData.onChainStatus}`)}
                    </Badge>
                </div>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href={`/proposals/${linkId}`}>
                    {t('proposals_page.view_details')} <ArrowRight className="ms-2 size-4" />
                </Link>
            </Button>
        </div>
    );
}