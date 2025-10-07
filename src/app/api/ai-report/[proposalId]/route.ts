// src/app/api/ai-report/[proposalId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  const proposalId = params.proposalId;

  try {
    // در دنیای واقعی، این آدرس از متغیرهای محیطی خوانده می‌شود
    const aiEngineUrl = `http://localhost:8000/reports/proposal/${proposalId}`;
    const response = await fetch(aiEngineUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch analysis from AI engine.');
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching proposal analysis.', error: (error as Error).message },
      { status: 500 }
    );
  }
}