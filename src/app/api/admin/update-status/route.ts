// src/app/api/admin/update-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, status } = body; // id: onChainId (number), status: string

        if (id === undefined || !status) {
            return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
        }

        const db = await getDb();
        
        // آپدیت وضعیت بر اساس proposalIdOnChain
        const result = await db.collection('proposals').updateOne(
            { proposalIdOnChain: id.toString() }, // تبدیل به رشته چون در DB رشته است
            { 
                $set: { 
                    onChainStatus: status,
                    updatedAt: new Date()
                } 
            }
        );

        if (result.matchedCount === 0) {
            // تلاش دوم: شاید ID به صورت عدد ذخیره شده باشد
            await db.collection('proposals').updateOne(
                { proposalIdOnChain: Number(id) },
                { 
                    $set: { 
                        onChainStatus: status,
                        updatedAt: new Date()
                    } 
                }
            );
        }

        return NextResponse.json({ success: true, message: 'Status updated' });

    } catch (error) {
        console.error("Update Status Error:", error);
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}