// src/app/api/proposals/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const db = await getDb();
        const proposals = await db.collection('proposals').find({}, {
                projection: {
                    _id: 1, 
                    proposalIdOnChain: 1,
                    projectName: 1,
                    tagline: 1,
                    startupIndustry: 1,
                    onChainStatus: 1,
                    createdAt: 1,
                    // ✅✅✅ FIX: اضافه کردن فیلدهای حیاتی برای داشبورد ✅✅✅
                    proposerAddress: 1, // برای تشخیص صاحب پروپوزال
                    milestones: 1,      // برای محاسبه مجموع سرمایه جذب شده
                    aiAnalysis: 1,      // برای نمایش خلاصه وضعیت هوش مصنوعی (اختیاری)
                },
                sort: { createdAt: -1 }, 
                limit: 50, 
            }
        ).toArray();
        
        // تبدیل _id به رشته و ایمن‌سازی داده‌ها
        const sanitizedProposals = proposals.map(p => ({
            ...p,
            _id: p._id.toString(),
            // اطمینان از اینکه milestone ها آرایه هستند
            milestones: Array.isArray(p.milestones) ? p.milestones : [],
        }));

        return NextResponse.json({ success: true, data: sanitizedProposals });

    } catch (error) {
        console.error("Error fetching proposals:", error);
        await logEvent('ERROR', 'API_ERROR', 'Failed to fetch proposals list.');
        return NextResponse.json({ success: false, message: 'Failed to fetch proposals.' }, { status: 500 });
    }
}