// src/app/api/proposals/[id]/route.ts - NEXT.JS 15/16 COMPATIBLE

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

// در Next.js 15+، پارامترها پرامیس هستند
type Props = {
  params: Promise<{ id: string }>
}

export async function GET(
    req: NextRequest,
    props: Props
) {
    try {
        // ✅✅✅ تغییر حیاتی: await کردن params
        const params = await props.params;
        const id = params.id;

        // لاگ برای اطمینان از دریافت صحیح
        console.log(`📡 API Received ID: "${id}"`);

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
        }

        const db = await getDb();
        const collection = db.collection('proposals');

        // ساخت کوئری هوشمند (برای شناسه رشته‌ای یا عددی)
        const searchConditions: any[] = [];

        // 1. اگر فرمت ObjectId دارد
        if (ObjectId.isValid(id) && id.length === 24) {
            searchConditions.push({ _id: new ObjectId(id) });
        }

        // 2. جستجوی Exact (رشته) - برای وقتی که "4" ذخیره شده
        searchConditions.push({ proposalIdOnChain: id });

        // 3. جستجوی عددی - برای وقتی که 4 ذخیره شده
        if (!isNaN(Number(id))) {
            searchConditions.push({ proposalIdOnChain: Number(id) });
        }

        const query = { $or: searchConditions };

        const proposal = await collection.findOne(query);

        if (!proposal) {
            console.warn(`❌ No proposal found for ID: ${id}`);
            return NextResponse.json({ success: false, message: 'Proposal not found.' }, { status: 404 });
        }
        
        // تبدیل ObjectId به رشته
        const responseData = {
            ...proposal,
            _id: proposal._id.toString(),
        };

        return NextResponse.json({ success: true, data: responseData });

    } catch (error) {
        console.error(`🔥 API Error:`, error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}