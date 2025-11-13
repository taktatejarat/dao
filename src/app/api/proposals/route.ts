// src/app/api/proposals/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';

export async function GET(req: NextRequest) {
    try {
        const db = await getDb();
        const proposalsCollection = db.collection('proposals');

        // ما فقط فیلدهای ضروری برای نمایش در لیست را برمی‌گردانیم تا حجم پاسخ کم باشد
        const proposals = await proposalsCollection.find(
            {}, // می‌توانید فیلترهایی مانند { onChainStatus: 'confirmed' } اضافه کنید
            {
                projection: {
                    _id: 1, // _id را به عنوان رشته برمی‌گردانیم
                    proposalIdOnChain: 1,
                    projectName: 1,
                    tagline: 1,
                    startupIndustry: 1,
                    onChainStatus: 1,
                    createdAt: 1,
                },
                sort: { createdAt: -1 }, // جدیدترین‌ها ابتدا نمایش داده شوند
                limit: 50, // محدود کردن به ۵۰ پروپوزال آخر
            }
        ).toArray();
        
        // تبدیل _id به رشته
        const sanitizedProposals = proposals.map(p => ({
            ...p,
            _id: p._id.toString(),
        }));

        return NextResponse.json({ success: true, proposals: sanitizedProposals });

    } catch (error) {
        console.error("Error fetching proposals:", error);
        await logEvent('ERROR', 'API_ERROR', 'Failed to fetch proposals list.');
        return NextResponse.json({ success: false, message: 'Failed to fetch proposals.' }, { status: 500 });
    }
}