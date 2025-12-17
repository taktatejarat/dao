// src/app/api/admin/update-status/route.ts - FIXED JSON PARSING

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        // ✅ FIX: بررسی اینکه آیا اصلا درخواستی وجود دارد یا خیر
        const text = await req.text();
        if (!text) {
            return NextResponse.json({ success: false, message: 'Empty request body' }, { status: 400 });
        }

        let body;
        try {
            body = JSON.parse(text);
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON format' }, { status: 400 });
        }

        const { id, status } = body; 

        if (id === undefined || !status) {
            return NextResponse.json({ success: false, message: 'Missing id or status' }, { status: 400 });
        }

        const db = await getDb();
        
        // تلاش برای آپدیت با فرمت رشته‌ای
        let result = await db.collection('proposals').updateOne(
            { proposalIdOnChain: id.toString() },
            { 
                $set: { 
                    onChainStatus: status,
                    updatedAt: new Date()
                } 
            }
        );

        // تلاش دوم با فرمت عددی (اگر قبلی پیدا نشد)
        if (result.matchedCount === 0) {
            result = await db.collection('proposals').updateOne(
                { proposalIdOnChain: Number(id) },
                { 
                    $set: { 
                        onChainStatus: status,
                        updatedAt: new Date()
                    } 
                }
            );
        }

        if (result.matchedCount > 0) {
            return NextResponse.json({ success: true, message: 'Status updated successfully' });
        } else {
            return NextResponse.json({ success: false, message: 'Proposal not found' }, { status: 404 });
        }

    } catch (error) {
        console.error("Update Status Error:", error);
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}