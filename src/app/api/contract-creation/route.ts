// src/app/api/contract-creation/route.ts - FINAL FIX: HASH ONLY (NO SYSTEM TX)

import { NextRequest, NextResponse } from 'next/server';
import { Address, Hex, keccak256, encodePacked, parseEther } from 'viem';
import { getDb } from '@/lib/mongodb'; // ✅ NEW: وارد کردن getDb
import { logEvent } from '@/lib/logger';  // ✅ NEW: وارد کردن logger


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
            milestoneAmounts,
            aiFeatures 
        } = await req.json();

        // ۱. اعتبارسنجی
        if (!description || !recipientAddress || !milestoneAmounts || milestoneAmounts.length === 0) {
            await logEvent('WARN', 'USER_ACTION', 'Proposal creation failed: Missing fields.', { proposerAddress });
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }
        
        // ۲. محاسبه هش
        const descriptionHash = computeProposalHash(description);
        
        // ۳. ذخیره داده‌های Off-chain در MongoDB
        const db = await getDb();
        const proposalsCollection = db.collection('proposals'); // ✅ استفاده از collection 'proposals'
        
        const offChainData = {
            proposerAddress,
            description,
            recipientAddress,
            milestoneAmounts: milestoneAmounts.map((a: string) => a.toString()),
            aiFeatures: aiFeatures || {},
            descriptionHash: descriptionHash,
            createdAt: new Date(),
            // فیلدهای اولیه برای وضعیت آن‌چین
            onChainStatus: 'pending_submission',
            proposalIdOnChain: null, 
        };

        // ✅ به جای saveOffChainProposal، مستقیماً از MongoDB استفاده می‌کنیم
        const result = await proposalsCollection.insertOne(offChainData);

        await logEvent('INFO', 'USER_ACTION', 'Off-chain proposal data saved successfully.', {
            proposer: proposerAddress,
            mongoId: result.insertedId.toString(),
            descriptionHash: descriptionHash
        });
        
        // ۴. برگرداندن پاسخ برای فرانت‌اند
        return NextResponse.json({ 
            success: true, 
            message: 'Off-chain data saved. Ready for on-chain submission.',
            descriptionHash,
            txArgs: [
                descriptionHash, 
                recipientAddress as Address,
                milestoneAmounts.map((a: string) => parseEther(a)),
            ],
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