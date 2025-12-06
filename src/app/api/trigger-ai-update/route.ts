// src/app/api/trigger-ai-update/route.ts - نسخه نهایی و کامل

import { NextRequest, NextResponse } from 'next/server';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
    try {
        // ✅ FIX: دریافت تمام داده‌های لازم از body درخواست
        const { proposalId, aiFeatures, milestoneAmounts } = await req.json();

        if (!proposalId || !aiFeatures || !milestoneAmounts) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: proposalId, aiFeatures, or milestoneAmounts.' },
                { status: 400 }
            );
        }

        // فراخوانی Endpoint جدید در سرویس AI
        const response = await fetch(`${AI_ENGINE_URL}/action/update-risk/${proposalId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // ✅ FIX: ارسال داده‌های پروپوزال در body
            body: JSON.stringify({ aiFeatures, milestoneAmounts }),
        });

        if (response.ok) {
            return NextResponse.json({ 
                success: true, 
                message: `AI Risk update triggered successfully for Proposal ${proposalId}.` 
            }, { status: 200 });
        } else {
            const errorText = await response.text();
            throw new Error(`AI Oracle API failed with status ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error("Failed to trigger AI Oracle:", error);
        return NextResponse.json(
            { success: false, message: (error as Error).message || 'Failed to trigger AI Oracle.' }, 
            { status: 500 }
        );
    }
}