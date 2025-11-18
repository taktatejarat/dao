// src/app/api/proposals/[id]/update-onchain-id/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logEvent } from '@/lib/logger';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const proposalMongoId = params.id;
    const { onChainId } = await req.json();

    if (!ObjectId.isValid(proposalMongoId) || !onChainId) {
        return NextResponse.json({ success: false, message: 'Invalid input.' }, { status: 400 });
    }

    try {
        const db = await getDb();
        const result = await db.collection('proposals').updateOne(
            { _id: new ObjectId(proposalMongoId) },
            { $set: { 
                proposalIdOnChain: onChainId,
                onChainStatus: 'submitted' 
            }}
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, message: 'Proposal not found.' }, { status: 404 });
        }

        logEvent('INFO', 'DB_UPDATE', `Updated proposal ${proposalMongoId} with on-chain ID: ${onChainId}`);
        return NextResponse.json({ success: true, message: 'Database updated.' });

    } catch (error) {
        logEvent('ERROR', 'DB_UPDATE_FAIL', `Failed to update proposal ${proposalMongoId}`, { error: (error as Error).message });
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}