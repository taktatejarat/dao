// src/app/api/proposals/submit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';
import { keccak256, encodePacked, Address, parseEther } from 'viem';
import { z } from 'zod';

// ✅ تابع stringify امن
function safeJSONStringify(obj: any): string {
    const replacer = (key: string, value: any) =>
        typeof value === 'bigint' ? value.toString() : value;
    return JSON.stringify(obj, replacer);
}

// ✅ تابع پاسخ امن
function safeJsonResponse(data: any, options: ResponseInit = {}) {
    return new NextResponse(safeJSONStringify(data), {
        ...options,
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    });
}

// --- Schema Definitions ---
const milestoneSchema = z.object({
    name: z.string().min(3, "Milestone name is too short"),
    durationDays: z.string().regex(/^\d+$/, "Duration must be a number"),
    amount: z.string().regex(/^\d*\.?\d*$/, "Amount must be a number"),
});

const proposalSchema = z.object({
    proposerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid proposer address"),
    projectName: z.string().min(3, "Project name is required"),
    tagline: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    description: z.string().min(20, "Description is too short"), // کاهش محدودیت برای تست راحت‌تر
    problem: z.string().min(20, "Problem statement is too short"),
    solution: z.string().min(20, "Solution statement is too short"),
    businessModel: z.string().min(1, "Business model is required"),
    startupIndustry: z.string().min(1, "Industry is required"),
    teamExperienceYears: z.string().regex(/^\d+$/),
    teamBio: z.string().min(20, "Team bio is too short"),
    marketSize: z.string().regex(/^\d+$/),
    competitors: z.string().optional(),
    hasPreviousFunding: z.string().refine(val => val === 'true' || val === 'false'),
    fundingHistoryDetails: z.string().optional(),
    recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid recipient address"),
    milestones: z.array(milestoneSchema).min(1, "At least one milestone is required"),
    documents: z.object({
        pitchDeck: z.string().nullable(),
        financials: z.string().nullable(),
        legal: z.string().nullable(),
    }),
});

function computeProposalHash(data: object): `0x${string}` {
    const dataString = JSON.stringify(data);
    const salt = keccak256(encodePacked(['string'], ['rayan-chain-proposal-v2']));
    return keccak256(encodePacked(['string', 'bytes32'], [dataString, salt]));
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // ۱. اعتبارسنجی
        const validation = proposalSchema.safeParse(body);
        if (!validation.success) {
            console.error("Validation failed:", validation.error.errors);
            return NextResponse.json({ success: false, message: "Invalid data provided.", errors: validation.error.flatten() }, { status: 400 });
        }

        const data = validation.data;

        // ۲. محاسبه هش
        const descriptionHash = computeProposalHash({
            projectName: data.projectName,
            description: data.description,
            documents: data.documents
        });

        // ۳. ذخیره در دیتابیس
        const db = await getDb();
        const proposalsCollection = db.collection('proposals');

        const offChainData = {
            ...data,
            descriptionHash: descriptionHash,
            createdAt: new Date(),
            onChainStatus: 'pending_submission',
            proposalIdOnChain: null,
        };

        const result = await proposalsCollection.insertOne(offChainData);
        
        // ۴. آماده‌سازی آرگومان‌ها
        const txArgs = [
            descriptionHash,
            data.recipient as Address,
            data.milestones.map(m => ({
                name: m.name,
                durationDays: BigInt(m.durationDays),
                amount: parseEther(m.amount),
                state: 0, 
                proofOfProgressHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                released: false,
            })),
        ];

        // ✅✅✅ اصلاح حیاتی: بازگرداندن mongoId به فرانت‌اند ✅✅✅
        return safeJsonResponse({
            success: true,
            message: 'Proposal data saved. Ready for on-chain transaction.',
            mongoId: result.insertedId.toString(), // <--- این خط بسیار مهم است
            txArgs: txArgs,
        }, { status: 200 });

    } catch (error) {
        console.error("Error in /api/proposals/submit:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}