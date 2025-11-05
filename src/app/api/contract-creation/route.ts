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

        // ✅✅✅ THE FIX IS HERE: تبدیل دقیق انواع داده برای قرارداد هوشمند ✅✅✅
        const txArgs = [
            descriptionHash,
            recipientAddress as Address,
            milestones.map((m: MilestoneInput) => {
                // تمام فیلدهای struct باید به ترتیب و با نوع صحیح ارسال شوند
                return {
                    name: m.name,
                    // ✅ FIX: تبدیل رشته به BigInt برای uint256
                    durationDays: BigInt(m.durationDays || '0'),
                    // ✅ FIX: تبدیل رشته به BigInt (wei) برای uint256
                    amount: parseEther(m.amount || '0'),
                    // مقادیر پیش‌فرض برای فیلدهایی که در زمان ساخت تنظیم می‌شوند
                    state: 0, // Enum ProposalState.Pending
                    proofOfProgressHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
                    released: false,
                };
            }),
        ];

        // --- دیباگینگ پیشرفته برای تأیید نهایی ---
        const replacer = (key: any, value: any) =>typeof value === 'bigint' ? value.toString() : value;
        console.log("📦 [API DEBUG] Final txArgs with correct types:", JSON.stringify(txArgs, replacer, 2));

              // ساخت پاسخ JSON با استفاده از replacer
        const body = JSON.stringify({
            success: true,
            message: 'Off-chain data saved. Ready for on-chain submission.',
            descriptionHash,
            txArgs, // txArgs همچنان حاوی BigInt است
        }, replacer); // replacer را به stringify پاس می‌دهیم

        // بازگرداندن پاسخ به صورت دستی با هدر صحیح
        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
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
