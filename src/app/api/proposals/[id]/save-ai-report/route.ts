import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

type Props = {
  params: Promise<{ id: string }>
}

export async function POST(
    req: NextRequest,
    props: Props
) {
    const params = await props.params; // ✅ Await
    const proposalMongoId = params.id;
    const aiReport = await req.json();

    if (!ObjectId.isValid(proposalMongoId) || !aiReport) {
        return NextResponse.json({ success: false, message: 'Invalid input.' }, { status: 400 });
    }

    try {
        const db = await getDb();
        await db.collection('proposals').updateOne(
            { _id: new ObjectId(proposalMongoId) },
            { $set: { 
                aiAnalysis: aiReport,
                onChainStatus: 'analyzed' 
            }}
        );

        return NextResponse.json({ success: true, message: 'AI report saved to DB.' });

    } catch (error) {
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}