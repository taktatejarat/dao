// src/app/api/proposals/[id]/route.ts (نسخه کامل و نهایی)

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';
import { ObjectId } from 'mongodb'; // برای کار با ID های MongoDB

// تابع کمکی برای تبدیل امن BigInt به string در آبجکت‌های تودرتو
const safeStringify = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
};

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const proposalId = params.id;
        
        // اعتبارسنجی اولیه ID (می‌تواند شناسه آن‌چین یا آف‌چین باشد)
        if (!proposalId) {
            return NextResponse.json({ success: false, message: 'Proposal ID is required.' }, { status: 400 });
        }

        const db = await getDb();
        const collection = db.collection('proposals');

        // جستجو بر اساس شناسه آن‌چین (onChainId) یا شناسه MongoDB (_id)
        // این کار انعطاف‌پذیری را افزایش می‌دهد
        const query = ObjectId.isValid(proposalId)
            ? { _id: new ObjectId(proposalId) }
            : { proposalIdOnChain: proposalId };

        const proposal = await collection.findOne(query);

        if (!proposal) {
            return NextResponse.json({ success: false, message: 'Proposal not found.' }, { status: 404 });
        }
        
        // حذف _id برای جلوگیری از مشکلات serialize شدن
        const { _id, ...rest } = proposal;

        return NextResponse.json({ success: true, data: { ...rest, mongoId: _id.toString() } });

    } catch (error) {
        console.error(`Error fetching proposal ${params.id}:`, error);
        return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
    }
}