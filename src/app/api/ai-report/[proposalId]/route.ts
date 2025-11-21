// src/app/api/ai-report/[proposalId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// آدرس موتور AI از متغیرهای محیطی خوانده می‌شود
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  const proposalId = params.proposalId;

  if (!proposalId) {
    return NextResponse.json({ message: 'Proposal ID is required.' }, { status: 400 });
  }

  try {
    const aiEngineUrl = `${AI_ENGINE_URL}/reports/proposal/${proposalId}`;
    logEvent('INFO', 'AI_REPORT_FETCH', `Forwarding request to AI engine: ${aiEngineUrl}`);
    
    // ✅ FIX: استفاده از fetch برای ارسال درخواست به سرویس پایتون
    // ما از 'no-cache' استفاده می‌کنیم تا همیشه جدیدترین تحلیل دریافت شود
    const response = await fetch(aiEngineUrl, { cache: 'no-cache' });
    
    if (!response.ok) {
      const errorBody = await response.text();
      logEvent('ERROR', 'AI_ENGINE_ERROR', `AI engine failed with status ${response.status}`, { error: errorBody });
      throw new Error(`Failed to fetch analysis from AI engine. Status: ${response.status}`);
    }

    const data = await response.json();
    
    logEvent('INFO', 'AI_REPORT_SUCCESS', `Successfully fetched AI report for proposal ${proposalId}`);
    return NextResponse.json(data);

  } catch (error) {
    logEvent('ERROR', 'API_ERROR', `Error fetching AI report for proposal ${proposalId}`, { error: (error as Error).message });
    return NextResponse.json(
      { message: 'Error fetching proposal analysis.', error: (error as Error).message },
      { status: 500 }
    );
  }
}