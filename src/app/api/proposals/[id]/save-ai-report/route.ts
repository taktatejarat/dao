// src/app/api/proposals/[id]/save-ai-report/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const proposalMongoId = params.id;
    const aiReport = await req.json();

    if (!ObjectId.isValid(proposalMongoId) || !aiReport) {
        return NextResponse.json({ success: false, message: 'Invalid input.' }, { status: 400 });
    }

    try {
        const db = await getDb();
        await db.collection('proposals').updateOne(
            { _id: new ObjectId(proposalMongoId) },
            { $set: { 
                // یک فیلد جدید به نام aiAnalysis برای ذخیره کل گزارش اضافه می‌کنیم
                aiAnalysis: aiReport,
                onChainStatus: 'analyzed' // وضعیت را هم به‌روز می‌کنیم
            }}
        );

        return NextResponse.json({ success: true, message: 'AI report saved to DB.' });

    } catch (error) {
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}