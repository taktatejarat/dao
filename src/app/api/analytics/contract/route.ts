// src/app/api/analytics/contract/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/logger';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string' || code.trim().length < 50) {
      return NextResponse.json({ success: false, message: 'Contract code is too short or invalid.' }, { status: 400 });
    }

    const aiEngineUrl = `${AI_ENGINE_URL}/analytics/contract`;
    logEvent('INFO', 'CONTRACT_ANALYSIS_FETCH', `Forwarding contract code to AI engine.`);

    const response = await fetch(aiEngineUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI engine failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ success: true, data });

  } catch (error) {
    logEvent('ERROR', 'API_ERROR', 'Error during contract analysis', { error: (error as Error).message });
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}