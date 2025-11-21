// src/app/api/charts/investments/route.ts (فایل جدید)

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const db = await getDb();
        
        // Pipeline برای agregasi داده‌ها در MongoDB
        const pipeline = [
            // ۱. فقط پروپوزال‌های اجرا شده (موفق) را انتخاب کن
            { $match: { onChainStatus: 'executed' } },
            // ۲. هر milestone را به عنوان یک سند جداگانه در نظر بگیر
            { $unwind: "$milestones" },
            // ۳. داده‌ها را بر اساس ماه و سال گروه‌بندی کن
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    totalInvestment: { $sum: { $toDouble: "$milestones.amount" } }
                }
            },
            // ۴. بر اساس تاریخ مرتب کن
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            // ۵. فقط ۶ ماه آخر را برگردان
            { $limit: 6 }
        ];

        const results = await db.collection('proposals').aggregate(pipeline).toArray();

        // ۶. فرمت کردن داده برای نمودار
        const chartData = results.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            investment: item.totalInvestment
        }));

        return NextResponse.json({ success: true, data: chartData });

    } catch (error) {
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}