// src/app/api/proposals/[id]/trigger-ai/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logEvent } from '@/lib/logger';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } } // ✅ Next.js 'id' را از پوشه [id] می‌خواند
) {
    const proposalMongoId = params.id;

    try {
        logEvent('INFO', 'TRIGGER_AI_START', `Received request to trigger AI for proposal: ${proposalMongoId}`);

        // ۱. تأیید اینکه شناسه معتبر است
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

        const aiResponse = await response.json();
        logEvent('INFO', 'TRIGGER_AI_SUCCESS', `AI analysis successfully triggered for proposal: ${proposalMongoId}`, { aiResponse });
        
        return NextResponse.json({ success: true, message: 'AI analysis triggered.' });

    } catch (error) {
        logEvent('ERROR', 'TRIGGER_AI_ERROR', `Failed to trigger AI analysis for ${proposalMongoId}`, { error: (error as Error).message });
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}