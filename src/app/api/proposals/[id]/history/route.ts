// src/app/api/proposals/[id]/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const db = await getDb();
        
        // 1. دریافت لاگ‌های مستقیم این پروپوزال
        // فرض بر این است که سیستم لاگینگ ما (logEvent) فیلد entityId یا meta.mongoId را پر می‌کند
        const logs = await db.collection('system_logs')
            .find({ 
                $or: [
                    { "meta.mongoId": id },
                    { "meta.proposalId": id },
                    { "entityId": id } // استانداردسازی فیلدها مهم است
                ]
            })
            .sort({ timestamp: -1 })
            .toArray();

        // 2. استانداردسازی خروجی برای فرانت‌اند
        const formattedLogs = logs.map(log => ({
            id: log._id.toString(),
            type: log.level === 'ERROR' ? 'ERROR' : mapLogType(log.action),
            titleKey: `history.action.${log.action.toLowerCase()}`, // کلید ترجمه داینامیک
            description: log.message,
            timestamp: log.timestamp,
            txHash: log.meta?.txHash,
            metadata: log.meta
        }));

        return NextResponse.json({ success: true, data: formattedLogs });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch history' }, { status: 500 });
    }
}

// Helper to map backend log actions to frontend types
function mapLogType(action: string) {
    if (action.includes('VOTE')) return 'VOTE';
    if (action.includes('STATUS')) return 'STATUS_CHANGE';
    if (action.includes('AI')) return 'AI_ANALYSIS';
    if (action.includes('SUBMIT')) return 'CREATED';
    return 'GENERIC';
}