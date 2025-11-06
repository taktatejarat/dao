// src/app/api/contract-creation/route.ts - FINAL FIX WITH BIGINT SERIALIZATION

import { NextRequest, NextResponse } from 'next/server';
import { Address, Hex, keccak256, encodePacked, parseEther } from 'viem';
import { getDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';

interface MilestoneInput {
    name: string;
    durationDays: string;
    amount: string;
}

// Helper to serialize BigInts in an object before sending as JSON
function serializeBigInts(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => serializeBigInts(item));
    }
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'bigint') {
                newObj[key] = value.toString();
            } else {
                newObj[key] = serializeBigInts(value);
            }
        }
    }
    return newObj;
}

// Helper to compute hash using viem
function computeProposalHash(description: string): Hex {
    const salt = keccak256(encodePacked(['string'], ['proposal']));
    const data = encodePacked(['string', 'bytes32'], [description, salt]);
    return keccak256(data);
}


export async function POST(req: NextRequest) {
    try {
        const {
            proposerAddress,
            description,
            recipientAddress,
            milestones,
            aiFeatures
        } = await req.json();

        if (!description || !recipientAddress || !milestones || !Array.isArray(milestones) || milestones.length === 0) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

        const descriptionHash = computeProposalHash(description);
        const db = await getDb();
        const proposalsCollection = db.collection('proposals');

        const offChainData = {
            proposerAddress,
            description,
            recipientAddress,
            milestones,
            aiFeatures: aiFeatures || {},
            descriptionHash: descriptionHash,
            createdAt: new Date(),
            onChainStatus: 'pending_submission',
            proposalIdOnChain: null,
        };
        const result = await proposalsCollection.insertOne(offChainData);
        await logEvent('INFO', 'USER_ACTION', 'Off-chain proposal data saved.', { mongoId: result.insertedId.toString() });

        // ۱. ساخت آرگومان‌ها با نوع داده صحیح BigInt برای قرارداد
        const txArgs = [
            descriptionHash,
            recipientAddress as Address,
            milestones.map((m: MilestoneInput) => ({
                name: m.name,
                durationDays: BigInt(m.durationDays || '0'),
                amount: parseEther(m.amount || '0'),
                state: 0,
                proofOfProgressHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
                released: false,
            })),
        ];

        // ✅✅✅ THE FIX IS HERE ✅✅✅
        // ۲. ساخت یک نسخه سریالایز شده از آرگومان‌ها برای ارسال به فرانت‌اند
        const jsonSafeTxArgs = serializeBigInts(txArgs);

        // لاگ کردن آرگومان‌ها برای دیباگ (این لاگ اکنون باید در ترمینال شما نمایش داده شود)
        console.log("📦 [API DEBUG] Final txArgs prepared for contract call:", JSON.stringify(jsonSafeTxArgs, null, 2));

        return NextResponse.json({
            success: true,
            message: 'Off-chain data saved. Ready for on-chain submission.',
            descriptionHash,
            txArgs: jsonSafeTxArgs, // ✅ ارسال نسخه امن برای JSON
        }, { status: 200 });

        
    } catch (error) {
        await logEvent('ERROR', 'USER_ACTION', 'Error in contract-creation API.', { 
            error: (error as Error).message,
            stack: (error as Error).stack 
        });
        console.error("Error creating proposal:", error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
