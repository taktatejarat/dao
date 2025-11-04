// src/app/api/contract-creation/route.ts - FINAL FIX: HASH ONLY (NO SYSTEM TX)

import { NextRequest, NextResponse } from 'next/server';
import { Address, Hex, keccak256, encodePacked, parseEther } from 'viem';
import { getDb } from '@/lib/mongodb'; // ✅ NEW: وارد کردن getDb
import { logEvent } from '@/lib/logger';  // ✅ NEW: وارد کردن logger

// ✅ تعریف اینترفیس برای داده‌های ورودی برای افزایش خوانایی
interface MilestoneInput {
    name: string;
    durationDays: string;
    amount: string;
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
            await logEvent('WARN', 'USER_ACTION', 'Proposal creation failed: Missing fields.', { proposerAddress });
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

        const txArgs = [
            descriptionHash,
            recipientAddress as Address,
            milestones.map((m: MilestoneInput) => ({
                name: m.name,
                durationDays: BigInt(m.durationDays || '0').toString(), // تبدیل به رشته
                amount: parseEther(m.amount || '0').toString(), // تبدیل به رشته
                state: 0, 
                proofOfProgressHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                released: false,
            })),
        ];

        return NextResponse.json({
            success: true,
            message: 'Off-chain data saved. Ready for on-chain submission.',
            descriptionHash,
            txArgs, // ارسال آرگومان‌های صحیح
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
