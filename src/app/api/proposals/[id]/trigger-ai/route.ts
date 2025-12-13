// src/app/api/proposals/[id]/trigger-ai/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logEvent } from '@/lib/logger'; // ✅ بازگرداندن سیستم لاگینگ اصلی

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

type Props = {
  params: Promise<{ id: string }>
}

export async function POST(
    req: NextRequest,
    props: Props
) {
    const params = await props.params;
    const proposalMongoId = params.id;

    try {
        await logEvent('INFO', 'TRIGGER_AI_START', `Request received for proposal: ${proposalMongoId}`);

        // 1. Validate ID
        if (!ObjectId.isValid(proposalMongoId)) {
            return NextResponse.json({ success: false, message: 'Invalid ID format.' }, { status: 400 });
        }

        // 2. Check DB
        const db = await getDb();
        const proposal = await db.collection('proposals').findOne({ _id: new ObjectId(proposalMongoId) });

        if (!proposal) {
            await logEvent('WARN', 'TRIGGER_AI_FAIL', `Proposal not found in DB: ${proposalMongoId}`);
            return NextResponse.json({ success: false, message: 'Proposal not found.' }, { status: 404 });
        }

        // 3. Check AI Engine Connection (Fail-safe)
        try {
            // یک درخواست سبک به روت اصلی می‌فرستیم تا ببینیم سرور زنده است یا خیر
            await fetch(AI_ENGINE_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
        } catch (connError) {
            await logEvent('ERROR', 'AI_ENGINE_OFFLINE', `Cannot connect to AI Engine at ${AI_ENGINE_URL}`, { error: (connError as Error).message });
            
            // به جای خطای 500 مرگبار، یک پاسخ موفق با هشدار برمی‌گردانیم تا کلاینت متوقف نشود
            return NextResponse.json({ 
                success: true, 
                warning: 'AI Engine is offline. Proposal saved but analysis is pending.',
                data: null
            });
        }

        // 4. Trigger Analysis
        const aiEndpoint = `${AI_ENGINE_URL}/action/trigger-risk-analysis/${proposalMongoId}`;
        await logEvent('INFO', 'TRIGGER_AI_START', `Calling AI Engine`, { url: aiEndpoint });

        const response = await fetch(aiEndpoint, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errText = await response.text();
            await logEvent('ERROR', 'AI_ENGINE_ERROR', `AI responded with error`, { status: response.status, body: errText });
            throw new Error(`AI Engine Error: ${errText}`);
        }

        const aiResponse = await response.json();
        await logEvent('INFO', 'AI_RESPONSE_RECEIVED', `AI Analysis completed`, { score: aiResponse.investability_score });

        // 5. Update DB
        await db.collection('proposals').updateOne(
            { _id: new ObjectId(proposalMongoId) },
            { 
                $set: { 
                    aiAnalysis: aiResponse, 
                    onChainStatus: 'analyzed',
                    updatedAt: new Date()
                } 
            }
        );

        return NextResponse.json({ success: true, data: aiResponse });

    } catch (error) {
        await logEvent('ERROR', 'TRIGGER_AI_FAIL', `Fatal error in trigger-ai`, { error: (error as Error).message });
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}