// src/components/dashboard/ai-oracle-status.tsx

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useOracleStatus } from "@/hooks/useOracleStatus";

export function AiOracleStatus() {
    const { t } = useTranslation();
    const { status, lastChecked } = useOracleStatus();
    
    const getStatusIcon = (s: string) => {
        if (s === 'online') return <CheckCircle className="h-6 w-6 text-green-500" />;
        if (s === 'offline') return <XCircle className="h-6 w-6 text-red-500" />;
        return <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />;
    };
    
    const getStatusText = (s: string) => {
        if (s === 'online') return t('dashboard.ai_status_online');
        if (s === 'offline') return t('dashboard.ai_status_offline');
        if (s === 'error') return t('dashboard.ai_status_error');
        return t('dashboard.ai_status_loading');
    };

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    {t('dashboard.ai_oracle_status_title')}
                </CardTitle>
                <div className="pt-1">{getStatusIcon(status.status)}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mb-1">{getStatusText(status.status)}</div>
                <p className="text-xs text-muted-foreground">
                    {lastChecked ? `${t('dashboard.last_checked')}: ${lastChecked.toLocaleTimeString()}` : t('dashboard.checking_now')}
                </p>
                <CardDescription className="text-xs mt-2">
                    {status.message}
                </CardDescription>
            </CardContent>
        </Card>
    );
}