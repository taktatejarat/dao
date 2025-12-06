// src/app/api/ai-report/[proposalId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logEvent } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// ✅ تایپ جدید برای پارامترها
type Props = {
  params: Promise<{ proposalId: string }>
}

export async function GET(
  request: NextRequest,
  props: Props
) {
  try {
    // ✅ باز کردن پرامیس
    const params = await props.params;
    const inputId = params.proposalId;

    if (!inputId) {
      return NextResponse.json({ message: 'Proposal ID is required.' }, { status: 400 });
    }

    // --- بقیه منطق مثل قبل (کد هوشمند Resolver) ---
    const db = await getDb();
    const collection = db.collection('proposals');

    let query = {};
    if (ObjectId.isValid(inputId) && inputId.length === 24) {
        query = { _id: new ObjectId(inputId) };
    } else {
        query = {
            $or: [
                { proposalIdOnChain: inputId },
                { proposalIdOnChain: Number(inputId) }
            ]
        };
    }

    const proposal = await collection.findOne(query, { projection: { _id: 1 } });

    if (!proposal) {
        return NextResponse.json({ message: 'Proposal not found.' }, { status: 404 });
    }

    const realMongoId = proposal._id.toString();
    const aiEngineUrl = `${AI_ENGINE_URL}/reports/proposal/${realMongoId}`;
    
    const response = await fetch(aiEngineUrl, { cache: 'no-cache' });
    
    if (!response.ok) {
      if (response.status === 404) {
          return NextResponse.json({ status: 'pending', message: 'Analysis not generated yet' });
      }
      throw new Error(`AI Engine Error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Error fetching AI report.' }, { status: 500 });
  }
}