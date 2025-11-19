// src/app/api/proposals/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';


export async function GET(req: NextRequest) {
    try {
        const db = await getDb();
        const proposals = await db.collection('proposals').find({}, {
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

        // ✅✅✅ THE FIX: همیشه از کلید 'data' استفاده می‌کنیم ✅✅✅
        return NextResponse.json({ success: true, data: sanitizedProposals });

    } catch (error) {
        console.error("Error fetching proposals:", error);
        await logEvent('ERROR', 'API_ERROR', 'Failed to fetch proposals list.');
        return NextResponse.json({ success: false, message: 'Failed to fetch proposals.' }, { status: 500 });
    }
}