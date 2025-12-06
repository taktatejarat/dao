import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logEvent } from '@/lib/logger';

type Props = {
  params: Promise<{ id: string }>
}

export async function POST(
    req: NextRequest,
    props: Props
) {
    const params = await props.params; // ✅ Await
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

        return NextResponse.json({ success: true, message: 'Database updated.' });

    } catch (error) {
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}