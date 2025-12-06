// src/app/api/proposals/[id]/trigger-ai/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logEvent } from '@/lib/logger';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

// ✅ تعریف تایپ برای پراپ‌های ورودی
type Props = {
  params: Promise<{ id: string }>
}

export async function POST(
    req: NextRequest,
    props: Props // ✅ استفاده از تایپ جدید
) {
    try {
        // ✅ await کردن params برای استخراج id
        const params = await props.params;
        const proposalMongoId = params.id;

        logEvent('INFO', 'TRIGGER_AI_START', `Received request to trigger AI for proposal: ${proposalMongoId}`);

        if (!ObjectId.isValid(proposalMongoId)) {
            return NextResponse.json({ success: false, message: 'Invalid proposal ID format.' }, { status: 400 });
        }

        // ۲. (اختیاری اما پیشنهادی) تأیید وجود پروپوزال در دیتابیس
        const db = await getDb();
        const proposal = await db.collection('proposals').findOne({ _id: new ObjectId(proposalMongoId) });

        if (!proposal) {
            logEvent('WARN', 'TRIGGER_AI_FAIL', `Proposal not found in DB: ${proposalMongoId}`);
            return NextResponse.json({ success: false, message: 'Proposal not found in database.' }, { status: 404 });
        }

        // ۳. فراخوانی سرویس AI با شناسه MongoDB
        // سرویس پایتون خودش داده‌های لازم را از API ما (GET /api/proposals/[id]) خواهد خواند
        const aiEngineEndpoint = `${AI_ENGINE_URL}/action/trigger-risk-analysis/${proposalMongoId}`;
        logEvent('INFO', 'TRIGGER_AI_FORWARD', `Forwarding request to AI Engine: ${aiEngineEndpoint}`);
        
        const response = await fetch(aiEngineEndpoint, { method: 'POST' });

        if (!response.ok) {
            const errorText = await response.text();
            logEvent('ERROR', 'AI_ENGINE_FAIL', `AI Engine failed for ${proposalMongoId}`, { error: errorText });
            throw new Error(`AI Engine failed: ${errorText}`);
        }

       // 2. دریافت نتیجه آنالیز
        const aiResponse = await response.json();
        logEvent('INFO', 'AI_RESPONSE_RECEIVED', `Received data from AI`, { aiResponse });

        // ✅✅✅ FIX: ذخیره مستقیم نتیجه در دیتابیس همین‌جا ✅✅✅
        // منتظر کال‌بک نمی‌مانیم، خودمان ذخیره می‌کنیم
        const updateResult = await db.collection('proposals').updateOne(
            { _id: new ObjectId(proposalMongoId) },
            { 
                $set: { 
                    aiAnalysis: aiResponse, // ذخیره کل آبجکت گزارش
                    onChainStatus: 'analyzed', // تغییر وضعیت
                    updatedAt: new Date()
                }
            }
        );

        if (updateResult.modifiedCount > 0) {
            logEvent('INFO', 'DB_UPDATED_WITH_AI', `Successfully saved AI report to DB for ${proposalMongoId}`);
        } else {
            logEvent('WARN', 'DB_UPDATE_NO_CHANGE', `AI report fetched but DB not updated (maybe same data)`);
        }
        
        return NextResponse.json({ 
            success: true, 
            message: 'AI analysis triggered and saved successfully.',
            data: aiResponse // داده را برمی‌گردانیم تا فرانت‌اند اگر خواست استفاده کند
        });

    } catch (error) {
        logEvent('ERROR', 'TRIGGER_AI_ERROR', `Failed process`, { error: (error as Error).message });
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}