// src/app/api/analytics/user/[address]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { logEvent } from '@/lib/logger';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const userAddress = params.address;

  if (!isAddress(userAddress)) {
    return NextResponse.json({ success: false, message: 'Invalid wallet address format.' }, { status: 400 });
  }

  try {
    // در این مرحله، ما فقط آدرس را به سرویس AI فوروارد می‌کنیم.
    // سرویس AI در آینده مسئولیت جمع‌آوری داده‌های تاریخچه کاربر را بر عهده خواهد داشت.
    const aiEngineUrl = `${AI_ENGINE_URL}/analytics/user/${userAddress}`;
    logEvent('INFO', 'USER_ANALYTICS_FETCH', `Forwarding request to AI engine: ${aiEngineUrl}`);

    const response = await fetch(aiEngineUrl, { cache: 'no-cache' });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI engine failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ success: true, data });

  } catch (error) {
    logEvent('ERROR', 'API_ERROR', `Error fetching user analytics for ${userAddress}`, { error: (error as Error).message });
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}